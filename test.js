var test = require('tape')
var acorn = require('acorn')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var syntax = require('micromark-extension-mdx-jsx')
var removePosition = require('unist-util-remove-position')
var mdxJsx = require('.')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown('<a />', {
      extensions: [syntax()],
      mdastExtensions: [mdxJsx.fromMarkdown]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'a',
          attributes: [],
          children: [],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 6, offset: 5}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 6, offset: 5}
      }
    },
    'should support flow jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<x>\t \n</x>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []},
    'should support flow jsx (agnostic) w/ just whitespace'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b/> c.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {type: 'mdxJsxTextElement', name: 'b', attributes: [], children: []},
        {type: 'text', value: ' c.'}
      ]
    },
    'should support self-closing text jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b></b> c.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {type: 'mdxJsxTextElement', name: 'b', attributes: [], children: []},
        {type: 'text', value: ' c.'}
      ]
    },
    'should support a closed text jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b>c</b> d.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [],
          children: [{type: 'text', value: 'c'}]
        },
        {type: 'text', value: ' d.'}
      ]
    },
    'should support text jsx (agnostic) w/ content'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b>*c*</b> d.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [],
          children: [{type: 'emphasis', children: [{type: 'text', value: 'c'}]}]
        },
        {type: 'text', value: ' d.'}
      ]
    },
    'should support text jsx (agnostic) w/ markdown content'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <></> b.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {type: 'mdxJsxTextElement', name: null, attributes: [], children: []},
        {type: 'text', value: ' b.'}
      ]
    },
    'should support a fragment text jsx (agnostic)'
  )

  t.throws(
    function () {
      fromMarkdown('a <b> c', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close `paragraph` \(1:1-1:8\): a different token \(`mdxJsxTextTag`, 1:3-1:6\) is open/,
    'should crash on an unclosed text jsx (agnostic)'
  )

  t.throws(
    function () {
      fromMarkdown('<a>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close document, a token \(`mdxJsxFlowTag`, 1:1-1:4\) is still open/,
    'should crash on an unclosed flow jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b {1 + 1} /> c', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [{type: 'mdxJsxExpressionAttribute', value: '1 + 1'}],
          children: []
        },
        {type: 'text', value: ' c'}
      ]
    },
    'should support an attribute expression in text jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b c={1 + 1} /> d', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'c',
              value: {type: 'mdxJsxAttributeValueExpression', value: '1 + 1'}
            }
          ],
          children: []
        },
        {type: 'text', value: ' d'}
      ]
    },
    'should support an attribute value expression in text jsx (agnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b {...c} /> d', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [{type: 'mdxJsxExpressionAttribute', value: '...c'}],
          children: []
        },
        {type: 'text', value: ' d'}
      ]
    },
    'should support an attribute expression in text jsx (gnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a {...{b: 1, c: Infinity, d: false}} />', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [
        {
          type: 'mdxJsxExpressionAttribute',
          value: '...{b: 1, c: Infinity, d: false}'
        }
      ],
      children: []
    },
    'should support an complex attribute expression in flow jsx (gnostic)'
  )

  t.deepEqual(
    JSON.parse(
      JSON.stringify(
        removePosition(
          fromMarkdown('<a {...b} />', {
            extensions: [syntax({acorn: acorn, addResult: true})],
            mdastExtensions: [mdxJsx.fromMarkdown]
          }),
          true
        ).children[0]
      )
    ),
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [
        {
          type: 'mdxJsxExpressionAttribute',
          value: '...b',
          data: {
            estree: {
              type: 'SpreadElement',
              start: 3,
              end: 7,
              loc: {start: {line: 1, column: 3}, end: {line: 1, column: 7}},
              argument: {
                type: 'Identifier',
                start: 6,
                end: 7,
                loc: {start: {line: 1, column: 6}, end: {line: 1, column: 7}},
                name: 'b'
              }
            }
          }
        }
      ],
      children: []
    },
    'should support an `estree` for an attribute expression in flow jsx (gnostic) w/ `addResult`'
  )

  t.deepEqual(
    JSON.parse(
      JSON.stringify(
        removePosition(
          fromMarkdown('<a b={1} />', {
            extensions: [syntax({acorn: acorn, addResult: true})],
            mdastExtensions: [mdxJsx.fromMarkdown]
          }),
          true
        ).children[0]
      )
    ),
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'b',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: '1',
            data: {
              estree: {
                type: 'Literal',
                start: 0,
                end: 1,
                loc: {start: {line: 1, column: 0}, end: {line: 1, column: 1}},
                value: 1,
                raw: '1'
              }
            }
          }
        }
      ],
      children: []
    },
    'should support an `estree` for an attribute value expression in flow jsx (gnostic) w/ `addResult`'
  )

  t.throws(
    function () {
      fromMarkdown('a <b {1 + 1} /> c', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Could not parse expression with acorn: SyntaxError: Unexpected token/,
    'should crash on a non-spread attribute expression'
  )

  t.throws(
    function () {
      fromMarkdown('a <b c={?} /> d', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Could not parse expression with acorn: SyntaxError: Unexpected token/,
    'should crash on invalid JS in an attribute expression'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a < \t>b</>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: null,
          attributes: [],
          children: [{type: 'text', value: 'b'}]
        }
      ]
    },
    'should support whitespace in the opening tag (fragment)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a < \nb\t>c</b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [],
          children: [{type: 'text', value: 'c'}]
        }
      ]
    },
    'should support whitespace in the opening tag (named)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<π />', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {type: 'mdxJsxFlowElement', name: 'π', attributes: [], children: []},
    'should support non-ascii identifier start characters'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a\u200Cb />', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {type: 'mdxJsxFlowElement', name: 'a\u200Cb', attributes: [], children: []},
    'should support non-ascii identifier continuation characters'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<abc . def.ghi />', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'abc.def.ghi',
      attributes: [],
      children: []
    },
    'should support dots in names for method names'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<svg: rect>b</  svg :rect>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {
          type: 'mdxJsxTextElement',
          name: 'svg:rect',
          attributes: [],
          children: [{type: 'text', value: 'b'}]
        }
      ]
    },
    'should support colons in names for local names'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b c     d="d"\t\tefg=\'h\'>i</b>.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [
            {type: 'mdxJsxAttribute', name: 'c', value: null},
            {type: 'mdxJsxAttribute', name: 'd', value: 'd'},
            {type: 'mdxJsxAttribute', name: 'efg', value: 'h'}
          ],
          children: [{type: 'text', value: 'i'}]
        },
        {type: 'text', value: '.'}
      ]
    },
    'should support attributes'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a xml :\tlang\n= "de-CH" foo:bar/>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [
        {type: 'mdxJsxAttribute', name: 'xml:lang', value: 'de-CH'},
        {type: 'mdxJsxAttribute', name: 'foo:bar', value: null}
      ],
      children: []
    },
    'should support prefixed attributes'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<b a b : c d : e = "f" g/>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'b',
      attributes: [
        {type: 'mdxJsxAttribute', name: 'a', value: null},
        {type: 'mdxJsxAttribute', name: 'b:c', value: null},
        {type: 'mdxJsxAttribute', name: 'd:e', value: 'f'},
        {type: 'mdxJsxAttribute', name: 'g', value: null}
      ],
      children: []
    },
    'should support prefixed and normal attributes'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <>`<`</> c', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: null,
          attributes: [],
          children: [{type: 'inlineCode', value: '<'}]
        },
        {type: 'text', value: ' c'}
      ]
    },
    'should support code (text) in jsx (text)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<>\n```js\n<\n```\n</>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: null,
      attributes: [],
      children: [{type: 'code', lang: 'js', meta: null, value: '<'}]
    },
    'should support code (fenced) in jsx (flow)'
  )

  t.throws(
    function () {
      fromMarkdown('a </> c', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing slash `\/` in tag, expected an open tag first/,
    'should crash on a closing tag w/o open elements (text)'
  )

  t.throws(
    function () {
      fromMarkdown('</>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing slash `\/` in tag, expected an open tag first/,
    'should crash on a closing tag w/o open elements (flow)'
  )

  t.throws(
    function () {
      fromMarkdown('a <></b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/b>`, expected corresponding closing tag for `<>` \(1:3-1:5\)/,
    'should crash on mismatched tags (1)'
  )
  t.throws(
    function () {
      fromMarkdown('a <b></>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/>`, expected corresponding closing tag for `<b>` \(1:3-1:6\)/,
    'should crash on mismatched tags (2)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a.b></a>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (3)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a></a.b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/,
    'should crash on mismatched tags (4)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a.b></a.c>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a\.c>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (5)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a:b></a>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (6)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a></a:b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a:b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/,
    'should crash on mismatched tags (7)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a:b></a:c>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a:c>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (8)'
  )
  t.throws(
    function () {
      fromMarkdown('a <a:b></a.b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (9)'
  )

  t.throws(
    function () {
      fromMarkdown('<a>b</a/>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected self-closing slash `\/` in closing tag, expected the end of the tag/,
    'should crash on a closing self-closing tag'
  )

  t.throws(
    function () {
      fromMarkdown('<a>b</a b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Unexpected attribute in closing tag, expected the end of the tag/,
    'should crash on a closing tag w/ attributes'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('a <b>c <>d</> e</b>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'a '},
        {
          type: 'mdxJsxTextElement',
          name: 'b',
          attributes: [],
          children: [
            {type: 'text', value: 'c '},
            {
              type: 'mdxJsxTextElement',
              name: null,
              attributes: [],
              children: [{type: 'text', value: 'd'}]
            },
            {type: 'text', value: ' e'}
          ]
        }
      ]
    },
    'should support nested jsx (text)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a> <>\nb\n</>\n</a>', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [],
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: null,
          attributes: [],
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        }
      ]
    },
    'should support nested jsx (flow)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown(
        '<x y="Character references can be used: &quot;, &apos;, &lt;, &gt;, &#x7B;, and &#x7D;, they can be named, decimal, or hexadecimal: &copy; &#8800; &#x1D306;" />',
        {
          extensions: [syntax()],
          mdastExtensions: [mdxJsx.fromMarkdown]
        }
      ),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'x',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'y',
          value:
            'Character references can be used: ", \', <, >, {, and }, they can be named, decimal, or hexadecimal: © ≠ 𝌆'
        }
      ],
      children: []
    },
    'should support character references in attribute values'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<x />.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'mdxJsxTextElement', name: 'x', attributes: [], children: []},
        {type: 'text', value: '.'}
      ]
    },
    'should support as text if the tag is not the last thing'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('.<x />', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'paragraph',
      children: [
        {type: 'text', value: '.'},
        {type: 'mdxJsxTextElement', name: 'x', attributes: [], children: []}
      ]
    },
    'should support as text if the tag is not the first thing'
  )

  t.throws(
    function () {
      fromMarkdown('a *open <b> close* </b> c.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close `emphasis` \(1:3-1:19\): a different token \(`mdxJsxTextTag`, 1:9-1:12\) is open/,
    'should crash when misnesting w/ attention (emphasis)'
  )

  t.throws(
    function () {
      fromMarkdown('a **open <b> close** </b> c.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close `strong` \(1:3-1:21\): a different token \(`mdxJsxTextTag`, 1:10-1:13\) is open/,
    'should crash when misnesting w/ attention (strong)'
  )

  t.throws(
    function () {
      fromMarkdown('a [open <b> close](c) </b> d.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close `link` \(1:3-1:22\): a different token \(`mdxJsxTextTag`, 1:9-1:12\) is open/,
    'should crash when misnesting w/ label (link)'
  )

  t.throws(
    function () {
      fromMarkdown('a ![open <b> close](c) </b> d.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      })
    },
    /Cannot close `image` \(1:3-1:23\): a different token \(`mdxJsxTextTag`, 1:10-1:13\) is open/,
    'should crash when misnesting w/ label (image)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a <b>\n> c </b> d.', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [],
              children: [{type: 'text', value: '\nc '}]
            },
            {type: 'text', value: ' d.'}
          ]
        }
      ]
    },
    'should support line endings in elements'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a <b c="d\n> e" /> f', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [{type: 'mdxJsxAttribute', name: 'c', value: 'd\ne'}],
              children: []
            },
            {type: 'text', value: ' f'}
          ]
        }
      ]
    },
    'should support line endings in attribute values'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a <b c={d\n> e} /> f', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'c',
                  value: {type: 'mdxJsxAttributeValueExpression', value: 'd\ne'}
                }
              ],
              children: []
            },
            {type: 'text', value: ' f'}
          ]
        }
      ]
    },
    'should support line endings in attribute value expressions'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a <b {c\n> d} /> e', {
        extensions: [syntax()],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [{type: 'mdxJsxExpressionAttribute', value: 'c\nd'}],
              children: []
            },
            {type: 'text', value: ' e'}
          ]
        }
      ]
    },
    'should support line endings in attribute expressions'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a <b {...[1,\n> 2]} /> c', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [
                {type: 'mdxJsxExpressionAttribute', value: '...[1,\n2]'}
              ],
              children: []
            },
            {type: 'text', value: ' c'}
          ]
        }
      ]
    },
    'should support line endings in attribute expressions (gnostic)'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a>\n> b\nc\n> d\n</a>', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [],
      children: [
        {
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b\nc\nd'}]}
          ]
        }
      ]
    },
    'should support block quotes in flow'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<a>\n- b\nc\n- d\n</a>', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'mdxJsxFlowElement',
      name: 'a',
      attributes: [],
      children: [
        {
          type: 'list',
          ordered: false,
          start: null,
          spread: false,
          children: [
            {
              type: 'listItem',
              spread: false,
              checked: null,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'b\nc'}]}
              ]
            },
            {
              type: 'listItem',
              spread: false,
              checked: null,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
              ]
            }
          ]
        }
      ]
    },
    'should support lists in flow'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('> a\n- b\nc\n- d', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {
          type: 'blockquote',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {
          type: 'list',
          ordered: false,
          start: null,
          spread: false,
          children: [
            {
              type: 'listItem',
              spread: false,
              checked: null,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'b\nc'}]}
              ]
            },
            {
              type: 'listItem',
              spread: false,
              checked: null,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
              ]
            }
          ]
        }
      ]
    },
    'should support normal markdown w/o jsx'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('<x><y>\n\nz\n\n</y></x>', {
        extensions: [syntax({acorn: acorn})],
        mdastExtensions: [mdxJsx.fromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'x',
          attributes: [],
          children: [
            {
              type: 'mdxJsxFlowElement',
              name: 'y',
              attributes: [],
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'z'}]}
              ]
            }
          ]
        }
      ]
    },
    'should support multiple flow elements with their tags on the same line'
  )

  t.end()
})

test('mdast -> markdown', function (t) {
  t.deepEqual(
    toMarkdown({type: 'mdxJsxFlowElement'}, {extensions: [mdxJsx.toMarkdown]}),
    '<></>\n',
    'should serialize flow jsx w/o `name`, `attributes`, or `children`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'mdxJsxFlowElement', name: 'x'},
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x/>\n',
    'should serialize flow jsx w/ `name` w/o `attributes`, `children`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x>\n  y\n</x>\n',
    'should serialize flow jsx w/ `name`, `children` w/o `attributes`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<>\n  y\n</>\n',
    'should serialize flow jsx w/ `children` w/o `name`, `attributes`'
  )

  t.throws(
    function () {
      toMarkdown(
        {
          type: 'mdxJsxFlowElement',
          attributes: [{type: 'mdxJsxExpressionAttribute', value: 'x'}]
        },
        {extensions: [mdxJsx.toMarkdown]}
      )
    },
    /Cannot serialize fragment w\/ attributes/,
    'should crash when serializing fragment w/ attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x {y}/>\n',
    'should serialize flow jsx w/ `name`, `attributes` w/o `children`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}],
        children: [{type: 'paragraph', children: [{type: 'text', value: 'z'}]}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x {y}>\n  z\n</x>\n',
    'should serialize flow jsx w/ `name`, `attributes`, `children`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxExpressionAttribute', value: 'y'},
          {type: 'mdxJsxExpressionAttribute', value: 'z'}
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x\n  {y}\n  {z}\n/>\n',
    'should serialize flow jsx w/ `name`, multiple `attributes` w/o `children`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: '...{y: "z"}'}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x {...{y: "z"}}/>\n',
    'should serialize expression attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute'}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x {}/>\n',
    'should serialize expression attributes w/o `value`'
  )

  t.throws(
    function () {
      toMarkdown(
        {
          type: 'mdxJsxFlowElement',
          name: 'x',
          attributes: [{type: 'mdxJsxAttribute', value: 'y'}]
        },
        {extensions: [mdxJsx.toMarkdown]}
      )
    },
    / Cannot serialize attribute w\/o name/,
    'should crash when serializing attribute w/o name'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y'}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x y/>\n',
    'should serialize boolean attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z'}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x y="z"/>\n',
    'should serialize value attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z'}]
      },
      {extensions: [mdxJsx.toMarkdown], quote: "'"}
    ),
    "<x y='z'/>\n",
    'should serialize value attributes honoring `quote`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'y',
            value: {type: 'mdxJsxAttributeValueExpression', value: 'z'}
          }
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x y={z}/>\n',
    'should serialize value expression attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'y',
            value: {type: 'mdxJsxAttributeValueExpression'}
          }
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x y={}/>\n',
    'should serialize value expression attributes w/o `value`'
  )

  t.deepEqual(
    toMarkdown({type: 'mdxJsxTextElement'}, {extensions: [mdxJsx.toMarkdown]}),
    '<></>\n',
    'should serialize text jsx w/o `name`, `attributes`, or `children`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'mdxJsxTextElement', name: 'x'},
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x/>\n',
    'should serialize text jsx w/ `name` w/o `attributes`, `children`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxTextElement',
        name: 'x',
        children: [{type: 'strong', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x>**y**</x>\n',
    'should serialize text jsx w/ `name`, `children` w/o `attributes`'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxTextElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxAttribute', name: 'y', value: 'z'},
          {type: 'mdxJsxAttribute', name: 'a'}
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x y="z" a/>\n',
    'should serialize text jsx w/ attributes'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'w '},
          {
            type: 'mdxJsxTextElement',
            name: 'x',
            children: [{type: 'text', value: 'y'}]
          },
          {type: 'text', value: ' z.'}
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    'w <x>y</x> z.\n',
    'should serialize text jsx in flow'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        children: [
          {
            type: 'blockquote',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
            ]
          },
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                children: [
                  {type: 'paragraph', children: [{type: 'text', value: 'b\nc'}]}
                ]
              },
              {
                type: 'listItem',
                children: [
                  {type: 'paragraph', children: [{type: 'text', value: 'd'}]}
                ]
              }
            ]
          }
        ]
      },
      {extensions: [mdxJsx.toMarkdown]}
    ),
    '<x>\n  > a\n\n  *   b\n      c\n\n  *   d\n</x>\n',
    'should serialize flow in flow jsx'
  )

  t.end()
})
