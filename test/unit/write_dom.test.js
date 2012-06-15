suite('writeDOM', function() {
  test('basic', function() {
    var MyCommand = P(MathCommand, {
      writeHTML: function(write) {
        write('<span class="root" mq-command></span>', { c: this });
      }
    });

    var cmd = MyCommand();
    var dom = writeDOM(cmd);

    assert.ok(dom.is(cmd.jQ), 'sets up the .jQ reference');
    var domData = dom.data(jQueryDataKey);
    assert.ok(domData, 'has data');
    assert.ok(domData.c === cmd, 'sets up the command ref');
    assert.ok(domData.b === undefined, 'doesn\'t set up a block');
  });

  test('with a single child block', function() {
    var MyCommand = P(MathCommand, {
      writeHTML: function(write) {
        var block = this.firstChild;
        write('<span class="root" mq-command mq-block>', { c: this, b: block });
        write('</span>');
      }
    });

    var MySymbol = P(MathCommand, function(_) {
      _.init = function(klass) {
        this.klass = klass
      };

      _.writeHTML = function(write) {
        write('<span class="'+this.klass+'" mq-command></span>', { c: this });
      };
    });

    // TODO: better tree methods, like adopt, disown
    var block = MathBlock();
    var first = MySymbol('first');
    var second = MySymbol('second');
    first.parent = second.parent = block;
    first.next = block.lastChild = second;
    second.prev = block.firstChild = first;

    var cmd = MyCommand();
    cmd.firstChild = cmd.lastChild = block;

    var dom = writeDOM(cmd);

    var firstDom = dom.find('.first');
    var secondDom = dom.find('.second');

    assert.ok(firstDom.length, 'first child is rendered');
    assert.ok(secondDom.length, 'second child is rendered');
    assert.ok(firstDom.next().is(secondDom), 'they are rendered in order');

    assert.ok(
      firstDom.data(jQueryDataKey).c === first,
      'first block is referenced from dom'
    );

    assert.ok(
      secondDom.data(jQueryDataKey).c === second,
      'second block is referenced from dom'
    );

    assert.ok(firstDom.is(first.jQ), 'first dom is referenced by .jQ');
    assert.ok(secondDom.is(second.jQ), 'second dom is referenced by .jQ');

    var domData = dom.data(jQueryDataKey);
    assert.ok(domData.b === block, 'block is referenced in dom');
    assert.ok(domData.c === cmd, 'command is referenced in dom');
  });
});
