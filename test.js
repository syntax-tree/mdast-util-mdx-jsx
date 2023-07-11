import assert from 'node:assert/strict'
import test from 'node:test'
import * as acorn from 'acorn'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {mdxJsx} from 'micromark-extension-mdx-jsx'
import {mdxMd} from 'micromark-extension-mdx-md'
import {mdxJsxFromMarkdown, mdxJsxToMarkdown} from './index.js'
import * as mod from './index.js'

test('core', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['mdxJsxFromMarkdown', 'mdxJsxToMarkdown'],
    'should expose the public api'
  )
})

test('mdxJsxFromMarkdown', () => {
  assert.deepEqual(
    fromMarkdown('<a />', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
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

  let tree = fromMarkdown('<x>\t \n</x>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []}
      ]
    },
    'should support flow jsx (agnostic) w/ just whitespace'
  )

  tree = fromMarkdown('a <b/> c.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [],
              children: []
            },
            {type: 'text', value: ' c.'}
          ]
        }
      ]
    },
    'should support self-closing text jsx (agnostic)'
  )

  tree = fromMarkdown('a <b></b> c.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [],
              children: []
            },
            {type: 'text', value: ' c.'}
          ]
        }
      ]
    },
    'should support a closed text jsx (agnostic)'
  )

  tree = fromMarkdown('a <b>c</b> d.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support text jsx (agnostic) w/ content'
  )

  tree = fromMarkdown('a <b>*c*</b> d.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [],
              children: [
                {type: 'emphasis', children: [{type: 'text', value: 'c'}]}
              ]
            },
            {type: 'text', value: ' d.'}
          ]
        }
      ]
    },
    'should support text jsx (agnostic) w/ markdown content'
  )

  tree = fromMarkdown('a <></> b.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: 'a '},
            {
              type: 'mdxJsxTextElement',
              name: null,
              attributes: [],
              children: []
            },
            {type: 'text', value: ' b.'}
          ]
        }
      ]
    },
    'should support a fragment text jsx (agnostic)'
  )

  assert.throws(
    () => {
      fromMarkdown('a <b> c', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Expected a closing tag for `<b>` \(1:3-1:6\) before the end of `paragraph`/,
    'should crash on an unclosed text jsx (agnostic)'
  )

  assert.throws(
    () => {
      fromMarkdown('<a>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Expected a closing tag for `<a>` \(1:1-1:4\)/,
    'should crash on an unclosed flow jsx (agnostic)'
  )

  tree = fromMarkdown('a <b {1 + 1} /> c', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support an attribute expression in text jsx (agnostic)'
  )

  tree = fromMarkdown('a <b c={1 + 1} /> d', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
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
                  value: {
                    type: 'mdxJsxAttributeValueExpression',
                    value: '1 + 1'
                  }
                }
              ],
              children: []
            },
            {type: 'text', value: ' d'}
          ]
        }
      ]
    },
    'should support an attribute value expression in text jsx (agnostic)'
  )

  tree = fromMarkdown('a <b {...c} /> d', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support an attribute expression in text jsx (gnostic)'
  )

  tree = fromMarkdown('<a {...{b: 1, c: Infinity, d: false}} />', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support an complex attribute expression in flow jsx (gnostic)'
  )

  tree = fromMarkdown('<a {...b} />', {
    extensions: [mdxJsx({acorn, addResult: true})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  tree = JSON.parse(JSON.stringify(tree))

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'a',
          attributes: [
            {
              type: 'mdxJsxExpressionAttribute',
              value: '...b',
              data: {
                estree: {
                  type: 'Program',
                  start: 4,
                  end: 8,
                  body: [
                    {
                      type: 'ExpressionStatement',
                      expression: {
                        type: 'ObjectExpression',
                        start: 4,
                        end: 8,
                        loc: {
                          start: {line: 1, column: 4, offset: 4},
                          end: {line: 1, column: 8, offset: 8}
                        },
                        properties: [
                          {
                            type: 'SpreadElement',
                            start: 4,
                            end: 8,
                            loc: {
                              start: {line: 1, column: 4, offset: 4},
                              end: {line: 1, column: 8, offset: 8}
                            },
                            argument: {
                              type: 'Identifier',
                              start: 7,
                              end: 8,
                              loc: {
                                start: {line: 1, column: 7, offset: 7},
                                end: {line: 1, column: 8, offset: 8}
                              },
                              name: 'b',
                              range: [7, 8]
                            },
                            range: [4, 8]
                          }
                        ],
                        range: [4, 8]
                      },
                      start: 4,
                      end: 8,
                      loc: {
                        start: {line: 1, column: 4, offset: 4},
                        end: {line: 1, column: 8, offset: 8}
                      },
                      range: [4, 8]
                    }
                  ],
                  sourceType: 'module',
                  comments: [],
                  loc: {
                    start: {line: 1, column: 4, offset: 4},
                    end: {line: 1, column: 8, offset: 8}
                  },
                  range: [4, 8]
                }
              }
            }
          ],
          children: []
        }
      ]
    },
    'should support an `estree` for an attribute expression in flow jsx (gnostic) w/ `addResult`'
  )

  tree = fromMarkdown('<a b={1} />', {
    extensions: [mdxJsx({acorn, addResult: true})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  tree = JSON.parse(JSON.stringify(tree))

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
                    type: 'Program',
                    start: 6,
                    end: 7,
                    body: [
                      {
                        type: 'ExpressionStatement',
                        expression: {
                          type: 'Literal',
                          start: 6,
                          end: 7,
                          loc: {
                            start: {line: 1, column: 6, offset: 6},
                            end: {line: 1, column: 7, offset: 7}
                          },
                          value: 1,
                          raw: '1',
                          range: [6, 7]
                        },
                        start: 6,
                        end: 7,
                        loc: {
                          start: {line: 1, column: 6, offset: 6},
                          end: {line: 1, column: 7, offset: 7}
                        },
                        range: [6, 7]
                      }
                    ],
                    sourceType: 'module',
                    comments: [],
                    loc: {
                      start: {line: 1, column: 6, offset: 6},
                      end: {line: 1, column: 7, offset: 7}
                    },
                    range: [6, 7]
                  }
                }
              }
            }
          ],
          children: []
        }
      ]
    },
    'should support an `estree` for an attribute value expression in flow jsx (gnostic) w/ `addResult`'
  )

  assert.throws(
    () => {
      fromMarkdown('a <b {1 + 1} /> c', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Could not parse expression with acorn/,
    'should crash on a non-spread attribute expression'
  )

  assert.throws(
    () => {
      fromMarkdown('a <b c={?} /> d', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Could not parse expression with acorn/,
    'should crash on invalid JS in an attribute expression'
  )

  assert.throws(
    () => {
      fromMarkdown('a < \t>b</>', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing slash `\/` in tag, expected an open tag first/,
    'should *not* support whitespace in the opening tag (fragment)'
  )

  tree = fromMarkdown('a <b\t>c</b>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support whitespace in the opening tag (named)'
  )

  tree = fromMarkdown('<π />', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {type: 'mdxJsxFlowElement', name: 'π', attributes: [], children: []}
      ]
    },
    'should support non-ascii identifier start characters'
  )

  tree = fromMarkdown('<a\u200Cb />', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {type: 'mdxJsxFlowElement', name: 'a‌b', attributes: [], children: []}
      ]
    },
    'should support non-ascii identifier continuation characters'
  )

  tree = fromMarkdown('<abc . def.ghi />', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'abc.def.ghi',
          attributes: [],
          children: []
        }
      ]
    },
    'should support dots in names for method names'
  )

  tree = fromMarkdown('<svg: rect>b</  svg :rect>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support colons in names for local names'
  )

  tree = fromMarkdown('a <b c     d="d"\t\tefg=\'h\'>i</b>.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support attributes'
  )

  tree = fromMarkdown('<a xml :\tlang\n= "de-CH" foo:bar/>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'a',
          attributes: [
            {type: 'mdxJsxAttribute', name: 'xml:lang', value: 'de-CH'},
            {type: 'mdxJsxAttribute', name: 'foo:bar', value: null}
          ],
          children: []
        }
      ]
    },
    'should support prefixed attributes'
  )

  tree = fromMarkdown('<b a b : c d : e = "f" g/>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support prefixed and normal attributes'
  )

  tree = fromMarkdown('a <>`<`</> c', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support code (text) in jsx (text)'
  )

  tree = fromMarkdown('<>\n```js\n<\n```\n</>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: null,
          attributes: [],
          children: [{type: 'code', lang: 'js', meta: null, value: '<'}]
        }
      ]
    },
    'should support code (fenced) in jsx (flow)'
  )

  assert.throws(
    () => {
      fromMarkdown('a </> c', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing slash `\/` in tag, expected an open tag first/,
    'should crash on a closing tag w/o open elements (text)'
  )

  assert.throws(
    () => {
      fromMarkdown('</>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing slash `\/` in tag, expected an open tag first/,
    'should crash on a closing tag w/o open elements (flow)'
  )

  assert.throws(
    () => {
      fromMarkdown('a <></b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/b>`, expected corresponding closing tag for `<>` \(1:3-1:5\)/,
    'should crash on mismatched tags (1)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <b></>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/>`, expected corresponding closing tag for `<b>` \(1:3-1:6\)/,
    'should crash on mismatched tags (2)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a.b></a>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (3)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a></a.b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/,
    'should crash on mismatched tags (4)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a.b></a.c>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a\.c>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (5)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a:b></a>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (6)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a></a:b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a:b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/,
    'should crash on mismatched tags (7)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a:b></a:c>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a:c>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (8)'
  )
  assert.throws(
    () => {
      fromMarkdown('a <a:b></a.b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/,
    'should crash on mismatched tags (9)'
  )

  assert.throws(
    () => {
      fromMarkdown('<a>b</a/>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected self-closing slash `\/` in closing tag, expected the end of the tag/,
    'should crash on a closing self-closing tag'
  )

  assert.throws(
    () => {
      fromMarkdown('<a>b</a b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Unexpected attribute in closing tag, expected the end of the tag/,
    'should crash on a closing tag w/ attributes'
  )

  tree = fromMarkdown('a <b>c <>d</> e</b>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support nested jsx (text)'
  )

  tree = fromMarkdown('<a> <>\nb\n</>\n</a>', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support nested jsx (flow)'
  )

  tree = fromMarkdown(
    '<x y="Character references can be used: &quot;, &apos;, &lt;, &gt;, &#x7B;, and &#x7D;, they can be named, decimal, or hexadecimal: &copy; &#8800; &#x1D306;" />',
    {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    }
  )

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support character references in attribute values'
  )

  tree = fromMarkdown('<x />.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'mdxJsxTextElement',
              name: 'x',
              attributes: [],
              children: []
            },
            {type: 'text', value: '.'}
          ]
        }
      ]
    },
    'should support as text if the tag is not the last thing'
  )

  tree = fromMarkdown('.<x />', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {type: 'text', value: '.'},
            {type: 'mdxJsxTextElement', name: 'x', attributes: [], children: []}
          ]
        }
      ]
    },
    'should support as text if the tag is not the first thing'
  )

  assert.throws(
    () => {
      fromMarkdown('a *open <b> close* </b> c.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Expected a closing tag for `<b>` \(1:9-1:12\) before the end of `emphasis`/,
    'should crash when misnesting w/ attention (emphasis)'
  )

  assert.throws(
    () => {
      fromMarkdown('a **open <b> close** </b> c.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Expected a closing tag for `<b>` \(1:10-1:13\) before the end of `strong`/,
    'should crash when misnesting w/ attention (strong)'
  )

  assert.throws(() => {
    fromMarkdown('a [open <b> close](c) </b> d.', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })
  }, 'should crash when misnesting w/ label (link)')

  assert.throws(() => {
    fromMarkdown('a ![open <b> close](c) </b> d.', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })
  }, 'should crash when misnesting w/ label (image)')

  assert.throws(
    () => {
      fromMarkdown('<b> a *open </b> close* d.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    },
    /Expected the closing tag `<\/b>` either after the end of `emphasis` \(1:24\) or another opening tag after the start of `emphasis` \(1:7\)/,
    'should crash when misnesting w/ attention (emphasis)'
  )

  tree = fromMarkdown('> a <b>\n> c </b> d.', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support line endings in elements'
  )

  tree = fromMarkdown('> a <b c="d\n> e" /> f', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
                    {type: 'mdxJsxAttribute', name: 'c', value: 'd\ne'}
                  ],
                  children: []
                },
                {type: 'text', value: ' f'}
              ]
            }
          ]
        }
      ]
    },
    'should support line endings in attribute values'
  )

  tree = fromMarkdown('> a <b c={d\n> e} /> f', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
                      value: {
                        type: 'mdxJsxAttributeValueExpression',
                        value: 'd\ne'
                      }
                    }
                  ],
                  children: []
                },
                {type: 'text', value: ' f'}
              ]
            }
          ]
        }
      ]
    },
    'should support line endings in attribute value expressions'
  )

  tree = fromMarkdown('> a <b {c\n> d} /> e', {
    extensions: [mdxJsx()],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
                    {type: 'mdxJsxExpressionAttribute', value: 'c\nd'}
                  ],
                  children: []
                },
                {type: 'text', value: ' e'}
              ]
            }
          ]
        }
      ]
    },
    'should support line endings in attribute expressions'
  )

  tree = fromMarkdown('> a <b {...[1,\n> 2]} /> c', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
        }
      ]
    },
    'should support line endings in attribute expressions (gnostic)'
  )

  tree = fromMarkdown('<a>\n> b\nc\n> d\n</a>', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'a',
          attributes: [],
          children: [
            {
              type: 'blockquote',
              children: [
                {
                  type: 'paragraph',
                  children: [{type: 'text', value: 'b\nc\nd'}]
                }
              ]
            }
          ]
        }
      ]
    },
    'should support block quotes in flow'
  )

  tree = fromMarkdown('<a>\n- b\nc\n- d\n</a>', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
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
                    {
                      type: 'paragraph',
                      children: [{type: 'text', value: 'b\nc'}]
                    }
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
        }
      ]
    },
    'should support lists in flow'
  )

  tree = fromMarkdown('> a\n- b\nc\n- d', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
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

  tree = fromMarkdown('<x><y>\n\nz\n\n</y></x>', {
    extensions: [mdxJsx({acorn})],
    mdastExtensions: [mdxJsxFromMarkdown()]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
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
})

test('mdxJsxToMarkdown', () => {
  assert.deepEqual(
    // @ts-expect-error: `attributes`, `children`, `name` missing.
    toMarkdown({type: 'mdxJsxFlowElement'}, {extensions: [mdxJsxToMarkdown()]}),
    '<></>\n',
    'should serialize flow jsx w/o `name`, `attributes`, or `children`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `attributes`, `children` missing.
      {type: 'mdxJsxFlowElement', name: 'x'},
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x />\n',
    'should serialize flow jsx w/ `name` w/o `attributes`, `children`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `attributes` missing.
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x>\n  y\n</x>\n',
    'should serialize flow jsx w/ `name`, `children` w/o `attributes`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `children`, `name` missing.
      {
        type: 'mdxJsxFlowElement',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<>\n  y\n</>\n',
    'should serialize flow jsx w/ `children` w/o `name`, `attributes`'
  )

  assert.throws(
    () => {
      toMarkdown(
        // @ts-expect-error: `children`, `name` missing.
        {
          type: 'mdxJsxFlowElement',
          attributes: [{type: 'mdxJsxExpressionAttribute', value: 'x'}]
        },
        {extensions: [mdxJsxToMarkdown()]}
      )
    },
    /Cannot serialize fragment w\/ attributes/,
    'should crash when serializing fragment w/ attributes'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `children` missing.
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x {y} />\n',
    'should serialize flow jsx w/ `name`, `attributes` w/o `children`'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}],
        children: [{type: 'paragraph', children: [{type: 'text', value: 'z'}]}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x {y}>\n  z\n</x>\n',
    'should serialize flow jsx w/ `name`, `attributes`, `children`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `children` missing.
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxExpressionAttribute', value: 'y'},
          {type: 'mdxJsxExpressionAttribute', value: 'z'}
        ]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x {y} {z} />\n',
    'should serialize flow jsx w/ `name`, multiple `attributes` w/o `children`'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: '...{y: "z"}'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x {...{y: "z"}} />\n',
    'should serialize expression attributes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          // @ts-expect-error: `value` missing.
          {type: 'mdxJsxExpressionAttribute'}
        ]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x {} />\n',
    'should serialize expression attributes w/o `value`'
  )

  assert.throws(
    () => {
      toMarkdown(
        {
          type: 'mdxJsxFlowElement',
          name: 'x',
          attributes: [
            // @ts-expect-error: `name` missing.
            {type: 'mdxJsxAttribute', value: 'y'}
          ]
        },
        {extensions: [mdxJsxToMarkdown()]}
      )
    },
    / Cannot serialize attribute w\/o name/,
    'should crash when serializing attribute w/o name'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x y />\n',
    'should serialize boolean attributes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x y="z" />\n',
    'should serialize value attributes'
  )

  assert.deepEqual(
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
        ],
        children: []
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x y={z} />\n',
    'should serialize value expression attributes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'y',
            // @ts-expect-error: `value` missing.
            value: {type: 'mdxJsxAttributeValueExpression'}
          }
        ]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x y={} />\n',
    'should serialize value expression attributes w/o `value`'
  )

  assert.deepEqual(
    // @ts-expect-error: `attributes`, `name`, `children` missing.
    toMarkdown({type: 'mdxJsxTextElement'}, {extensions: [mdxJsxToMarkdown()]}),
    '<></>\n',
    'should serialize text jsx w/o `name`, `attributes`, or `children`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `attributes`, `children` missing.
      {type: 'mdxJsxTextElement', name: 'x'},
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x />\n',
    'should serialize text jsx w/ `name` w/o `attributes`, `children`'
  )

  assert.deepEqual(
    toMarkdown(
      // @ts-expect-error: `attributes` missing.
      {
        type: 'mdxJsxTextElement',
        name: 'x',
        children: [{type: 'strong', children: [{type: 'text', value: 'y'}]}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x>**y**</x>\n',
    'should serialize text jsx w/ `name`, `children` w/o `attributes`'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxTextElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxAttribute', name: 'y', value: 'z'},
          {type: 'mdxJsxAttribute', name: 'a'}
        ],
        children: []
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x y="z" a />\n',
    'should serialize text jsx w/ attributes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'w '},
          {
            type: 'mdxJsxTextElement',
            name: 'x',
            attributes: [],
            children: [{type: 'text', value: 'y'}]
          },
          {type: 'text', value: ' z.'}
        ]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    'w <x>y</x> z.\n',
    'should serialize text jsx in flow'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [],
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
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '<x>\n  > a\n\n  * b\n    c\n\n  * d\n</x>\n',
    'should serialize flow in flow jsx'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a < b'}]},
      {extensions: [mdxJsxToMarkdown()]}
    ),
    'a \\< b\n',
    'should escape `<` in text'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'definition', identifier: 'a', url: 'x', title: 'a\n<\nb'},
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '[a]: x "a\n\\<\nb"\n',
    'should escape `<` at the start of a line'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'link',
        url: 'svg:rect',
        children: [{type: 'text', value: 'svg:rect'}]
      },
      {extensions: [mdxJsxToMarkdown()]}
    ),
    '[svg:rect](svg:rect)\n',
    'should not serialize links as autolinks'
  )

  assert.deepEqual(
    toMarkdown({type: 'code', value: 'x'}, {extensions: [mdxJsxToMarkdown()]}),
    '```\nx\n```\n',
    'should not serialize code as indented'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({quote: "'"})]}
    ),
    "<x y='z' />\n",
    'should support `options.quote` to quote attribute values'
  )

  assert.throws(
    () => {
      toMarkdown(
        {
          type: 'mdxJsxFlowElement',
          name: 'x',
          attributes: [],
          children: []
        },
        // @ts-expect-error: runtime exception.
        {extensions: [mdxJsxToMarkdown({quote: '!'})]}
      )
    },
    /Cannot serialize attribute values with `!` for `options.quote`, expected `"`, or `'`/,
    'should crash on an unclosed text jsx (agnostic)'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
    ),
    '<x y="z" />\n',
    'should support `options.quoteSmart`: prefer `quote` w/o quotes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z"a\'b'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
    ),
    '<x y="z&#x22;a\'b" />\n',
    'should support `options.quoteSmart`: prefer `quote` w/ equal quotes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: 'z"a\'b"c'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
    ),
    '<x y=\'z"a&#x27;b"c\' />\n',
    'should support `options.quoteSmart`: use alternative w/ more preferred quotes'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxAttribute', name: 'y', value: "z\"a'b'c"}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
    ),
    '<x y="z&#x22;a\'b\'c" />\n',
    'should support `options.quoteSmart`: use quote w/ more alternative quotes'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []},
      {extensions: [mdxJsxToMarkdown({tightSelfClosing: false})]}
    ),
    '<x />\n',
    'should support `options.tightSelfClosing`: no space when `false`'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []},
      {extensions: [mdxJsxToMarkdown({tightSelfClosing: true})]}
    ),
    '<x/>\n',
    'should support `options.tightSelfClosing`: space when `true`'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxAttribute', name: 'y', value: 'aaa'},
          {type: 'mdxJsxAttribute', name: 'z', value: 'aa'}
        ],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({printWidth: 20})]}
    ),
    '<x y="aaa" z="aa" />\n',
    'should support attributes on one line up to the given `options.printWidth`'
  )
  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [
          {type: 'mdxJsxAttribute', name: 'y', value: 'aaa'},
          {type: 'mdxJsxAttribute', name: 'z', value: 'aaa'}
        ],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({printWidth: 20})]}
    ),
    '<x\n  y="aaa"\n  z="aaa"\n/>\n',
    'should support attributes on separate lines up to the given `options.printWidth`'
  )
  assert.deepEqual(
    toMarkdown(
      {
        type: 'mdxJsxFlowElement',
        name: 'x',
        attributes: [{type: 'mdxJsxExpressionAttribute', value: '\n  ...a\n'}],
        children: []
      },
      {extensions: [mdxJsxToMarkdown({printWidth: 20})]}
    ),
    '<x\n  {\n  ...a\n}\n/>\n',
    'should support attributes on separate lines if they contain line endings'
  )
})

test('roundtrip', () => {
  equal('<a x="a\nb\nc" />', '<a\n  x="a\nb\nc"\n/>\n', 'attribute')

  equal(
    '<a>\n<b x="a\nb\nc" />\n</a>',
    '<a>\n  <b\n    x="a\nb\nc"\n  />\n</a>\n',
    'attribute in nested element'
  )

  equal(
    '<a>\n  <b>\n    <c x="a\nb\nc" />\n  </b>\n</a>',
    '<a>\n  <b>\n    <c\n      x="a\nb\nc"\n    />\n  </b>\n</a>\n',
    'attribute in nested elements'
  )

  equal(
    '<a x={`a\nb\nc`} />',
    '<a\n  x={`a\nb\nc`}\n/>\n',
    'attribute expression'
  )

  equal(
    '<a>\n<b x={`a\nb\nc`} />\n</a>',
    '<a>\n  <b\n    x={`a\nb\nc`}\n  />\n</a>\n',
    'attribute expression in nested element'
  )

  equal(
    '<a>\n  <b>\n    <c x={`a\nb\nc`} />\n  </b>\n</a>',
    '<a>\n  <b>\n    <c\n      x={`a\nb\nc`}\n    />\n  </b>\n</a>\n',
    'attribute expression in nested elements'
  )

  equal('<a {\n...a\n} />', '<a\n  {\n...a\n}\n/>\n', 'expression')

  equal(
    '<a>\n<b {\n...a\n} />\n</a>',
    '<a>\n  <b\n    {\n...a\n}\n  />\n</a>\n',
    'expression in nested element'
  )

  equal(
    '<a>\n  <b>\n    <c {\n...a\n} />\n  </b>\n</a>',
    '<a>\n  <b>\n    <c\n      {\n...a\n}\n    />\n  </b>\n</a>\n',
    'expression in nested elements'
  )

  equal(
    `<a>
  <b>
    <c>
      > # d
      - e
      ---
      1. f
      ~~~js
      g
      ~~~
      <h/>
    </c>
  </b>
</a>`,
    `<a>
  <b>
    <c>
      > # d

      * e

      ***

      1. f

      \`\`\`js
      g
      \`\`\`

      <h />
    </c>
  </b>
</a>
`,
    'children in nested elements'
  )

  equal(
    `<video src="#">
  Download the <a href="#">WEBM</a> or
  <a href="#">MP4</a> video.
</video>
`,
    `<video src="#">
  Download the <a href="#">WEBM</a> or
  <a href="#">MP4</a> video.
</video>
`,
    'text children in flow elements'
  )

  /**
   * @param {string} input
   * @param {string} output
   * @param {string} message
   */
  function equal(input, output, message) {
    const intermediate1 = process(input)
    assert.equal(intermediate1, output, message + ' (#1)')
    const intermediate2 = process(intermediate1)
    assert.equal(intermediate2, output, message + ' (#2)')
    const intermediate3 = process(intermediate2)
    assert.equal(intermediate3, output, message + ' (#3)')
    const intermediate4 = process(intermediate3)
    assert.equal(intermediate4, output, message + ' (#4)')
  }

  /**
   * @param {string} input
   */
  function process(input) {
    return toMarkdown(
      fromMarkdown(input, {
        extensions: [mdxMd(), mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      }),
      {extensions: [mdxJsxToMarkdown()]}
    )
  }
})
