/*************************************************
 * Abstract base classes for math cmds and blocks
 ************************************************/

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var MathCmd = _class(new Node, function(ctrlSeq, htmlTemplate, textTemplate) {
  var cmd = this;

  if (ctrlSeq) cmd.ctrlSeq = ctrlSeq;
  if (htmlTemplate) cmd.htmlTemplate = htmlTemplate;
  if (textTemplate) cmd.textTemplate = textTemplate;
});
_.replaces = function(replaced) {
  this.replaced = replaced;
};
_.isEmpty = function() {
  return this.children().fold(true, function(isEmpty, child) {
    return isEmpty && child.isEmpty();
  });
};
_.remove = function() {
  this.disown().jQ.remove();
  return this;
};
_.createBefore = _._createBefore = function(cursor) {
  var cmd = this;

  cmd.jQ = $(cmd.htmlTemplate[0]).data(jQueryDataKeyFor.cmd, cmd);
  cmd.createBlocks();
  cursor.jQ.before(cmd.jQ);

  cursor.prev = cmd.adopt(cursor.parent, cursor.prev, cursor.next);

  //adjust context-sensitive spacing
  cmd.respace();
  if (cmd.next)
    cmd.next.respace();
  if (cmd.prev)
    cmd.prev.respace();

  cmd.placeCursor(cursor);

  cmd.bubble('redraw');
};
_.createBlocks = _._createBlocks = function() {
  var cmd = this, replaced = cmd.replaced;
  //single-block commands
  if (cmd.htmlTemplate.length === 1) {
    (new MathBlock(cmd.jQ, replaced)).adopt(cmd, 0, 0);
  }
  //otherwise, the succeeding elements of htmlTemplate should be child blocks
  else {
    (new MathBlock($(cmd.htmlTemplate[1]).appendTo(cmd.jQ), replaced))
      .adopt(cmd, 0, 0);
    for (var i = 2; i < cmd.htmlTemplate.length; i += 1)
      (new MathBlock($(cmd.htmlTemplate[i]).appendTo(cmd.jQ)))
        .adopt(cmd, cmd.lastChild, 0);
  }
  if (replaced)
    firstChild.jQ.append(replaced.jQ);
};
_.respace = $.noop; //placeholder for context-sensitive spacing
_.placeCursor = function(cursor) {
  //append the cursor to the first empty child, or if none empty, the last one
  cursor.appendTo(this.children().fold(this.firstChild, function(prev, child) {
    return prev.isEmpty() ? prev : child;
  }));
};
_.latex = function() {
  //return "%s{%s}{%s}..." % this.ctrlSeq, this.firstChild.latex(), ...
  return this.children().fold(this.ctrlSeq, function(latex, block) {
    return latex + '{' + (block.latex() || ' ') + '}';
  });
};
_.textTemplate = [''];
_.text = function() {
  var i = 0;
  return this.children().fold(this.textTemplate[i], function(text, child) {
    i += 1;
    var child_text = child.text();
    if (text && this.textTemplate[i] === '('
        && child_text[0] === '(' && child_text.slice(-1) === ')')
      return text + child_text.slice(1, -1) + this.textTemplate[i];
    return text + child.text() + (this.textTemplate[i] || '');
  });
};

/**
 * Lightweight command without blocks or children.
 */
var Symbol = _class(new MathCmd, function(ctrlSeq, html, text) {
  MathCmd.call(this, ctrlSeq, [ html ],
    text || (ctrlSeq && ctrlSeq.length > 1 ? ctrlSeq.slice(1) : ctrlSeq) );
});
_.replaces = function(replaced) {
  replaced.remove();
};
_.createBlocks = $.noop;
_.latex = function(){ return this.ctrlSeq; };
_.text = function(){ return this.textTemplate; };
_.placeCursor = $.noop;
_.isEmpty = function(){ return true; };

/**
 * Children and parent of MathCmd's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 * Takes as an optional argument a Group of MathCmds to be children.
 * It's .jQ should be the element containing it's children.
 */
var MathBlock = _class(new Node, function(jQ, children) {
  if (jQ)
    this.jQ = jQ.data(jQueryDataKeyFor.block, block);
  if (children)
    children.disown().adopt(this, 0, 0);
});
_.latex = function() {
  //return this.all().latex().join('')
  return this.children().fold('', function(latexSoFar, cmd) {
    return latexSoFar + cmd.latex();
  });
};
_.text = function() {
  return this.firstChild === this.lastChild ?
    this.firstChild.text() :
    this.children().fold('(', function(text, child) {
      return text + child.text();
    }) + ')';
};
_.isEmpty = function() {
  return this.firstChild === 0 && this.lastChild === 0;
};
_.focus = function() {
  this.jQ.addClass('hasCursor');
  if (this.isEmpty())
    this.jQ.removeClass('empty');

  return this;
};
_.blur = function() {
  this.jQ.removeClass('hasCursor');
  if (this.isEmpty())
    this.jQ.addClass('empty');

  return this;
};

