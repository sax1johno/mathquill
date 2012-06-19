function writeDOM(el) {
  var elementCache = {};
  var buffer = [];

  var makeId = (function() {
    var id = 0;

    return function() { return id += 1; };
  })();

  function write(str, opts) {
    if (!opts) opts = {};

    var block = opts.b;
    var cmd = opts.c;
    var id;

    if (block) {
      str = addId('block', str, register(block));
    }

    if (cmd) {
      str = addId('command', str, register(cmd));
    }

    buffer.push(str);

    if (block) {
      block.eachChild(function(child) {
        child.writeHTML(write);
      });
    }
  }

  function register(el) {
    var id = makeId();
    elementCache[id] = el;
    return id;
  }

  function addId(type, html, id) {
    var attr = 'mq-'+type;
    return html.replace(attr, attr+'='+id);
  }

  function link(dom) {
    // NB: .find doesn't include the top level.  We can safely assume
    // that the root node is almost always going to have a mq-command
    // or an mq-block, though.
    dom.find('*').andSelf().each(function() {
      var domNode = $(this);
      var blockId = domNode.attr('mq-block');
      var commandId = domNode.attr('mq-command');
      if (!blockId && !commandId) return;

      var block;
      var command;

      if (blockId) {
        block = elementCache[blockId];
        if (!block) error("couldn't find block with id "+blockId);
        block.jQ = domNode;
      }

      if (commandId) {
        command = elementCache[commandId];
        if (!command) error("couldn't find a command with id "+commandId);
        command.jQ = domNode;
      }

      domNode.data(jQueryDataKey, { c: command, b: block });
    });
  }

  function main(el) {
    el.writeHTML(write);
    var dom = $(buffer.join(''));
    link(dom);

    return dom;
  }

  return main(el);
}
