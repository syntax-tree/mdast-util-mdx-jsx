import assert from 'node:assert/strict'
import test from 'node:test'
import * as acorn from 'acorn'
import {mdxJsx} from 'micromark-extension-mdx-jsx'
import {mdxMd} from 'micromark-extension-mdx-md'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {mdxJsxFromMarkdown, mdxJsxToMarkdown} from 'mdast-util-mdx-jsx'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('mdast-util-mdx-jsx')).sort(), [
      'mdxJsxFromMarkdown',
      'mdxJsxToMarkdown'
    ])
  })
})

test('mdxJsxFromMarkdown', async function (t) {
  await t.test('should support flow jsx (agnostic)', async function () {
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
      }
    )
  })

  await t.test(
    'should support flow jsx (agnostic) w/ just whitespace',
    async function () {
      const tree = fromMarkdown('<x>\t \n</x>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []}
        ]
      })
    }
  )

  await t.test(
    'should support self-closing text jsx (agnostic)',
    async function () {
      const tree = fromMarkdown('a <b/> c.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support a closed text jsx (agnostic)',
    async function () {
      const tree = fromMarkdown('a <b></b> c.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support text jsx (agnostic) w/ content',
    async function () {
      const tree = fromMarkdown('a <b>c</b> d.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support text jsx (agnostic) w/ markdown content',
    async function () {
      const tree = fromMarkdown('a <b>*c*</b> d.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support a fragment text jsx (agnostic)',
    async function () {
      const tree = fromMarkdown('a <></> b.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should crash on an unclosed text jsx (agnostic)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a <b> c', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected a closing tag for `<b>` \(1:3-1:6\) before the end of `paragraph`/)
    }
  )

  await t.test(
    'should crash on an unclosed flow jsx (agnostic)',
    async function () {
      assert.throws(function () {
        fromMarkdown('<a>', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected a closing tag for `<a>` \(1:1-1:4\)/)
    }
  )

  await t.test(
    'should crash on unclosed jsx after closed jsx',
    async function () {
      assert.throws(function () {
        fromMarkdown('<a><b></b>', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected a closing tag for `<a>` \(1:1-1:4\)/)
    }
  )

  await t.test(
    'should support an attribute expression in text jsx (agnostic)',
    async function () {
      const tree = fromMarkdown('a <b {1 + 1} /> c', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
                  {type: 'mdxJsxExpressionAttribute', value: '1 + 1'}
                ],
                children: []
              },
              {type: 'text', value: ' c'}
            ]
          }
        ]
      })
    }
  )

  await t.test(
    'should support an attribute value expression in text jsx (agnostic)',
    async function () {
      const tree = fromMarkdown('a <b c={1 + 1} /> d', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
                    position: {
                      end: {
                        column: 15,
                        line: 1,
                        offset: 14
                      },
                      start: {
                        column: 6,
                        line: 1,
                        offset: 5
                      }
                    },
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
      })
    }
  )

  await t.test(
    'should support an attribute expression in text jsx (gnostic)',
    async function () {
      const tree = fromMarkdown('a <b {...c} /> d', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
                  {type: 'mdxJsxExpressionAttribute', value: '...c'}
                ],
                children: []
              },
              {type: 'text', value: ' d'}
            ]
          }
        ]
      })
    }
  )

  await t.test(
    'should support an complex attribute expression in flow jsx (gnostic)',
    async function () {
      const tree = fromMarkdown('<a {...{b: 1, c: Infinity, d: false}} />', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support an `estree` for an attribute expression in flow jsx (gnostic) w/ `addResult`',
    async function () {
      let tree = fromMarkdown('<a {...b} />', {
        extensions: [mdxJsx({acorn, addResult: true})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      tree = JSON.parse(JSON.stringify(tree))

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support an `estree` for an attribute value expression in flow jsx (gnostic) w/ `addResult`',
    async function () {
      let tree = fromMarkdown('<a b={1} />', {
        extensions: [mdxJsx({acorn, addResult: true})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      tree = JSON.parse(JSON.stringify(tree))

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'a',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'b',
                position: {
                  end: {
                    column: 9,
                    line: 1,
                    offset: 8
                  },
                  start: {
                    column: 4,
                    line: 1,
                    offset: 3
                  }
                },
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
      })
    }
  )

  await t.test(
    'should crash on a non-spread attribute expression',
    async function () {
      assert.throws(function () {
        fromMarkdown('a <b {1 + 1} /> c', {
          extensions: [mdxJsx({acorn})],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Could not parse expression with acorn/)
    }
  )

  await t.test(
    'should crash on invalid JS in an attribute expression',
    async function () {
      assert.throws(function () {
        fromMarkdown('a <b c={?} /> d', {
          extensions: [mdxJsx({acorn})],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Could not parse expression with acorn/)
    }
  )

  await t.test(
    'should *not* support whitespace in the opening tag (fragment)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a < \t>b</>', {
          extensions: [mdxJsx({acorn})],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Unexpected closing slash `\/` in tag, expected an open tag first/)
    }
  )

  await t.test(
    'should support whitespace in the opening tag (named)',
    async function () {
      const tree = fromMarkdown('a <b\t>c</b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support non-ascii identifier start characters',
    async function () {
      const tree = fromMarkdown('<π />', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {type: 'mdxJsxFlowElement', name: 'π', attributes: [], children: []}
        ]
      })
    }
  )

  await t.test(
    'should support non-ascii identifier continuation characters',
    async function () {
      const tree = fromMarkdown('<a\u200Cb />', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {type: 'mdxJsxFlowElement', name: 'a‌b', attributes: [], children: []}
        ]
      })
    }
  )

  await t.test(
    'should support dots in names for method names',
    async function () {
      const tree = fromMarkdown('<abc . def.ghi />', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'abc.def.ghi',
            attributes: [],
            children: []
          }
        ]
      })
    }
  )

  await t.test(
    'should support colons in names for local names',
    async function () {
      const tree = fromMarkdown('<svg: rect>b</  svg :rect>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test('should support attributes', async function () {
    const tree = fromMarkdown('a <b c     d="d"\t\tefg=\'h\'>i</b>.', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'a '
            },
            {
              type: 'mdxJsxTextElement',
              name: 'b',
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'c',
                  value: null,
                  position: {
                    start: {
                      line: 1,
                      column: 6,
                      offset: 5
                    },
                    end: {
                      line: 1,
                      column: 7,
                      offset: 6
                    }
                  }
                },
                {
                  type: 'mdxJsxAttribute',
                  name: 'd',
                  value: 'd',
                  position: {
                    start: {
                      line: 1,
                      column: 12,
                      offset: 11
                    },
                    end: {
                      line: 1,
                      column: 17,
                      offset: 16
                    }
                  }
                },
                {
                  type: 'mdxJsxAttribute',
                  name: 'efg',
                  value: 'h',
                  position: {
                    start: {
                      line: 1,
                      column: 19,
                      offset: 18
                    },
                    end: {
                      line: 1,
                      column: 26,
                      offset: 25
                    }
                  }
                }
              ],
              children: [
                {
                  type: 'text',
                  value: 'i'
                }
              ]
            },
            {
              type: 'text',
              value: '.'
            }
          ]
        }
      ]
    })
  })

  await t.test('should support prefixed attributes', async function () {
    const tree = fromMarkdown('<a xml :\tlang\n= "de-CH" foo:bar/>', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'a',
          attributes: [
            {
              type: 'mdxJsxAttribute',
              name: 'xml:lang',
              position: {
                end: {
                  column: 10,
                  line: 2,
                  offset: 23
                },
                start: {
                  column: 4,
                  line: 1,
                  offset: 3
                }
              },
              value: 'de-CH'
            },
            {
              type: 'mdxJsxAttribute',
              name: 'foo:bar',
              position: {
                end: {
                  column: 18,
                  line: 2,
                  offset: 31
                },
                start: {
                  column: 11,
                  line: 2,
                  offset: 24
                }
              },
              value: null
            }
          ],
          children: []
        }
      ]
    })
  })

  await t.test(
    'should support prefixed and normal attributes',
    async function () {
      const tree = fromMarkdown('<b a b : c d : e = "f" g/>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      // @todo check it, includes spaces at end of tags
      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'b',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'a',
                value: null,
                position: {
                  start: {
                    line: 1,
                    column: 4,
                    offset: 3
                  },
                  end: {
                    line: 1,
                    column: 5,
                    offset: 4
                  }
                }
              },
              {
                type: 'mdxJsxAttribute',
                name: 'b:c',
                value: null,
                position: {
                  start: {
                    line: 1,
                    column: 6,
                    offset: 5
                  },
                  end: {
                    line: 1,
                    column: 11,
                    offset: 10
                  }
                }
              },
              {
                type: 'mdxJsxAttribute',
                name: 'd:e',
                value: 'f',
                position: {
                  start: {
                    line: 1,
                    column: 12,
                    offset: 11
                  },
                  end: {
                    line: 1,
                    column: 23,
                    offset: 22
                  }
                }
              },
              {
                type: 'mdxJsxAttribute',
                name: 'g',
                value: null,
                position: {
                  start: {
                    line: 1,
                    column: 24,
                    offset: 23
                  },
                  end: {
                    line: 1,
                    column: 25,
                    offset: 24
                  }
                }
              }
            ],
            children: []
          }
        ]
      })
    }
  )

  await t.test('should support code (text) in jsx (text)', async function () {
    const tree = fromMarkdown('a <>`<`</> c', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test('should support code (fenced) in jsx (flow)', async function () {
    const tree = fromMarkdown('<>\n```js\n<\n```\n</>', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: null,
          attributes: [],
          children: [{type: 'code', lang: 'js', meta: null, value: '<'}]
        }
      ]
    })
  })

  await t.test(
    'should crash on a closing tag w/o open elements (text)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a </> c', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Unexpected closing slash `\/` in tag, expected an open tag first/)
    }
  )

  await t.test(
    'should crash on a closing tag w/o open elements (flow)',
    async function () {
      assert.throws(function () {
        fromMarkdown('</>', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Unexpected closing slash `\/` in tag, expected an open tag first/)
    }
  )

  await t.test('should crash on mismatched tags (1)', async function () {
    assert.throws(function () {
      fromMarkdown('a <></b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/b>`, expected corresponding closing tag for `<>` \(1:3-1:5\)/)
  })

  await t.test('should crash on mismatched tags (2)', async function () {
    assert.throws(function () {
      fromMarkdown('a <b></>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/>`, expected corresponding closing tag for `<b>` \(1:3-1:6\)/)
  })

  await t.test('should crash on mismatched tags (3)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a.b></a>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/)
  })

  await t.test('should crash on mismatched tags (4)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a></a.b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/)
  })

  await t.test('should crash on mismatched tags (5)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a.b></a.c>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a\.c>`, expected corresponding closing tag for `<a\.b>` \(1:3-1:8\)/)
  })

  await t.test('should crash on mismatched tags (6)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a:b></a>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/)
  })

  await t.test('should crash on mismatched tags (7)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a></a:b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a:b>`, expected corresponding closing tag for `<a>` \(1:3-1:6\)/)
  })

  await t.test('should crash on mismatched tags (8)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a:b></a:c>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a:c>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/)
  })

  await t.test('should crash on mismatched tags (9)', async function () {
    assert.throws(function () {
      fromMarkdown('a <a:b></a.b>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected closing tag `<\/a\.b>`, expected corresponding closing tag for `<a:b>` \(1:3-1:8\)/)
  })

  await t.test('should crash on a closing self-closing tag', async function () {
    assert.throws(function () {
      fromMarkdown('<a>b</a/>', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })
    }, /Unexpected self-closing slash `\/` in closing tag, expected the end of the tag/)
  })

  await t.test(
    'should crash on a closing tag w/ attributes',
    async function () {
      assert.throws(function () {
        fromMarkdown('<a>b</a b>', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Unexpected attribute in closing tag, expected the end of the tag/)
    }
  )

  await t.test('should support nested jsx (text)', async function () {
    const tree = fromMarkdown('a <b>c <>d</> e</b>', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test('should support nested jsx (flow)', async function () {
    const tree = fromMarkdown('<a> <>\nb\n</>\n</a>', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test(
    'should support character references in attribute values',
    async function () {
      const tree = fromMarkdown(
        '<x y="Character references can be used: &quot;, &apos;, &lt;, &gt;, &#x7B;, and &#x7D;, they can be named, decimal, or hexadecimal: &copy; &#8800; &#x1D306;" />',
        {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        }
      )

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'y',
                position: {
                  end: {
                    column: 158,
                    line: 1,
                    offset: 157
                  },
                  start: {
                    column: 4,
                    line: 1,
                    offset: 3
                  }
                },
                value:
                  'Character references can be used: ", \', <, >, {, and }, they can be named, decimal, or hexadecimal: © ≠ 𝌆'
              }
            ],
            children: []
          }
        ]
      })
    }
  )

  await t.test(
    'should support as text if the tag is not the last thing',
    async function () {
      const tree = fromMarkdown('<x />.', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support as text if the tag is not the first thing',
    async function () {
      const tree = fromMarkdown('.<x />', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {type: 'text', value: '.'},
              {
                type: 'mdxJsxTextElement',
                name: 'x',
                attributes: [],
                children: []
              }
            ]
          }
        ]
      })
    }
  )

  await t.test(
    'should crash when misnesting w/ attention (emphasis)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a *open <b> close* </b> c.', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected a closing tag for `<b>` \(1:9-1:12\) before the end of `emphasis`/)
    }
  )

  await t.test(
    'should crash when misnesting w/ attention (strong)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a **open <b> close** </b> c.', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected a closing tag for `<b>` \(1:10-1:13\) before the end of `strong`/)
    }
  )

  await t.test(
    'should crash when misnesting w/ label (link)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a [open <b> close](c) </b> d.', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      })
    }
  )

  await t.test(
    'should crash when misnesting w/ label (image)',
    async function () {
      assert.throws(function () {
        fromMarkdown('a ![open <b> close](c) </b> d.', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      })
    }
  )

  await t.test(
    'should crash when misnesting w/ attention (emphasis)',
    async function () {
      assert.throws(function () {
        fromMarkdown('<b> a *open </b> close* d.', {
          extensions: [mdxJsx()],
          mdastExtensions: [mdxJsxFromMarkdown()]
        })
      }, /Expected the closing tag `<\/b>` either after the end of `emphasis` \(1:24\) or another opening tag after the start of `emphasis` \(1:7\)/)
    }
  )

  await t.test('should support line endings in elements', async function () {
    const tree = fromMarkdown('> a <b>\n> c </b> d.', {
      extensions: [mdxJsx()],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test(
    'should support line endings in attribute values',
    async function () {
      const tree = fromMarkdown('> a <b c="d\n> e" /> f', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
                        position: {
                          end: {
                            column: 5,
                            line: 2,
                            offset: 16
                          },
                          start: {
                            column: 8,
                            line: 1,
                            offset: 7
                          }
                        },
                        value: 'd\ne'
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
      })
    }
  )

  await t.test(
    'should support line endings in attribute value expressions',
    async function () {
      const tree = fromMarkdown('> a <b c={d\n> e} /> f', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
                        position: {
                          end: {
                            column: 5,
                            line: 2,
                            offset: 16
                          },
                          start: {
                            column: 8,
                            line: 1,
                            offset: 7
                          }
                        },
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
      })
    }
  )

  await t.test(
    'should support line endings in attribute expressions',
    async function () {
      const tree = fromMarkdown('> a <b {c\n> d} /> e', {
        extensions: [mdxJsx()],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support line endings in attribute expressions (gnostic)',
    async function () {
      const tree = fromMarkdown('> a <b {...[1,\n> 2]} /> c', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test('should support block quotes in flow', async function () {
    const tree = fromMarkdown('<a>\n> b\nc\n> d\n</a>', {
      extensions: [mdxJsx({acorn})],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test('should support lists in flow', async function () {
    const tree = fromMarkdown('<a>\n- b\nc\n- d\n</a>', {
      extensions: [mdxJsx({acorn})],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
                    {
                      type: 'paragraph',
                      children: [{type: 'text', value: 'd'}]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  })

  await t.test('should support normal markdown w/o jsx', async function () {
    const tree = fromMarkdown('> a\n- b\nc\n- d', {
      extensions: [mdxJsx({acorn})],
      mdastExtensions: [mdxJsxFromMarkdown()]
    })

    removePosition(tree, {force: true})

    assert.deepEqual(tree, {
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
    })
  })

  await t.test(
    'should support multiple flow elements with their tags on the same line',
    async function () {
      const tree = fromMarkdown('<x><y>\n\nz\n\n</y></x>', {
        extensions: [mdxJsx({acorn})],
        mdastExtensions: [mdxJsxFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )
})

test('mdxJsxToMarkdown', async function (t) {
  await t.test(
    'should serialize flow jsx w/o `name`, `attributes`, or `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes`, `children`, `name` missing.
          {type: 'mdxJsxFlowElement'},
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<></>\n'
      )
    }
  )

  await t.test(
    'should serialize flow jsx w/ `name` w/o `attributes`, `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes`, `children` missing.
          {type: 'mdxJsxFlowElement', name: 'x'},
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x />\n'
      )
    }
  )

  await t.test(
    'should serialize flow jsx w/ `name`, `children` w/o `attributes`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes` missing.
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'y'}]}
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x>\n  y\n</x>\n'
      )
    }
  )

  await t.test(
    'should serialize flow jsx w/ `children` w/o `name`, `attributes`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `children`, `name` missing.
          {
            type: 'mdxJsxFlowElement',
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'y'}]}
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<>\n  y\n</>\n'
      )
    }
  )

  await t.test(
    'should crash when serializing fragment w/ attributes',
    async function () {
      assert.throws(function () {
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `children`, `name` missing.
          {
            type: 'mdxJsxFlowElement',
            attributes: [{type: 'mdxJsxExpressionAttribute', value: 'x'}]
          },
          {extensions: [mdxJsxToMarkdown()]}
        )
      }, /Cannot serialize fragment w\/ attributes/)
    }
  )

  await t.test(
    'should serialize flow jsx w/ `name`, `attributes` w/o `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `children` missing.
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x {y} />\n'
      )
    }
  )

  await t.test(
    'should serialize flow jsx w/ `name`, `attributes`, `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [{type: 'mdxJsxExpressionAttribute', value: 'y'}],
            children: [
              {type: 'paragraph', children: [{type: 'text', value: 'z'}]}
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x {y}>\n  z\n</x>\n'
      )
    }
  )

  await t.test(
    'should serialize flow jsx w/ `name`, multiple `attributes` w/o `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `children` missing.
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
        '<x {y} {z} />\n'
      )
    }
  )

  await t.test('should serialize expression attributes', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'mdxJsxFlowElement',
          name: 'x',
          attributes: [
            {type: 'mdxJsxExpressionAttribute', value: '...{y: "z"}'}
          ],
          children: []
        },
        {extensions: [mdxJsxToMarkdown()]}
      ),
      '<x {...{y: "z"}} />\n'
    )
  })

  await t.test(
    'should serialize expression attributes w/o `value`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              // @ts-expect-error: check how the runtime handles `value` missing.
              {type: 'mdxJsxExpressionAttribute'}
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x {} />\n'
      )
    }
  )

  await t.test(
    'should crash when serializing attribute w/o name',
    async function () {
      assert.throws(function () {
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              // @ts-expect-error: check how the runtime handles `name` missing.
              {type: 'mdxJsxAttribute', value: 'y'}
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        )
      }, / Cannot serialize attribute w\/o name/)
    }
  )

  await t.test('should serialize boolean attributes', async function () {
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
      '<x y />\n'
    )
  })

  await t.test('should serialize value attributes', async function () {
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
      '<x y="z" />\n'
    )
  })

  await t.test(
    'should serialize value expression attributes',
    async function () {
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
        '<x y={z} />\n'
      )
    }
  )

  await t.test(
    'should serialize value expression attributes w/o `value`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'y',
                // @ts-expect-error: check how the runtime handles `value` missing.
                value: {type: 'mdxJsxAttributeValueExpression'}
              }
            ]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x y={} />\n'
      )
    }
  )

  await t.test(
    'should serialize text jsx w/o `name`, `attributes`, or `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes`, `name`, `children` missing.
          {type: 'mdxJsxTextElement'},
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<></>\n'
      )
    }
  )

  await t.test(
    'should serialize text jsx w/ `name` w/o `attributes`, `children`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes`, `children` missing.
          {type: 'mdxJsxTextElement', name: 'x'},
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x />\n'
      )
    }
  )

  await t.test(
    'should serialize text jsx w/ `name`, `children` w/o `attributes`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          // @ts-expect-error: check how the runtime handles `attributes` missing.
          {
            type: 'mdxJsxTextElement',
            name: 'x',
            children: [{type: 'strong', children: [{type: 'text', value: 'y'}]}]
          },
          {extensions: [mdxJsxToMarkdown()]}
        ),
        '<x>**y**</x>\n'
      )
    }
  )

  await t.test('should serialize text jsx w/ attributes', async function () {
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
      '<x y="z" a />\n'
    )
  })

  await t.test('should serialize text jsx in flow', async function () {
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
      'w <x>y</x> z.\n'
    )
  })

  await t.test('should serialize flow in flow jsx', async function () {
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
                    {
                      type: 'paragraph',
                      children: [{type: 'text', value: 'b\nc'}]
                    }
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
      '<x>\n  > a\n\n  * b\n    c\n\n  * d\n</x>\n'
    )
  })

  await t.test('should escape `<` in text', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'paragraph', children: [{type: 'text', value: 'a < b'}]},
        {extensions: [mdxJsxToMarkdown()]}
      ),
      'a \\< b\n'
    )
  })

  await t.test('should escape `<` at the start of a line', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'definition', identifier: 'a', url: 'x', title: 'a\n<\nb'},
        {extensions: [mdxJsxToMarkdown()]}
      ),
      '[a]: x "a\n\\<\nb"\n'
    )
  })

  await t.test('should not serialize links as autolinks', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'link',
          url: 'svg:rect',
          children: [{type: 'text', value: 'svg:rect'}]
        },
        {extensions: [mdxJsxToMarkdown()]}
      ),
      '[svg:rect](svg:rect)\n'
    )
  })

  await t.test('should not serialize code as indented', async function () {
    assert.deepEqual(
      toMarkdown(
        {type: 'code', value: 'x'},
        {extensions: [mdxJsxToMarkdown()]}
      ),
      '```\nx\n```\n'
    )
  })

  await t.test(
    'should support `options.quote` to quote attribute values',
    async function () {
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
        "<x y='z' />\n"
      )
    }
  )

  await t.test(
    'should crash on an unclosed text jsx (agnostic)',
    async function () {
      assert.throws(function () {
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [],
            children: []
          },
          // @ts-expect-error: check how the runtime handles `quote` being wrong.
          {extensions: [mdxJsxToMarkdown({quote: '!'})]}
        )
      }, /Cannot serialize attribute values with `!` for `options.quote`, expected `"`, or `'`/)
    }
  )

  await t.test(
    'should support `options.quoteSmart`: prefer `quote` w/o quotes',
    async function () {
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
        '<x y="z" />\n'
      )
    }
  )

  await t.test(
    'should support `options.quoteSmart`: prefer `quote` w/ equal quotes',
    async function () {
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
        '<x y="z&#x22;a\'b" />\n'
      )
    }
  )

  await t.test(
    'should support `options.quoteSmart`: use alternative w/ more preferred quotes',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              {type: 'mdxJsxAttribute', name: 'y', value: 'z"a\'b"c'}
            ],
            children: []
          },
          {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
        ),
        '<x y=\'z"a&#x27;b"c\' />\n'
      )
    }
  )

  await t.test(
    'should support `options.quoteSmart`: use quote w/ more alternative quotes',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              {type: 'mdxJsxAttribute', name: 'y', value: "z\"a'b'c"}
            ],
            children: []
          },
          {extensions: [mdxJsxToMarkdown({quoteSmart: true})]}
        ),
        '<x y="z&#x22;a\'b\'c" />\n'
      )
    }
  )

  await t.test(
    'should support `options.tightSelfClosing`: no space when `false`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []},
          {extensions: [mdxJsxToMarkdown({tightSelfClosing: false})]}
        ),
        '<x />\n'
      )
    }
  )

  await t.test(
    'should support `options.tightSelfClosing`: space when `true`',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {type: 'mdxJsxFlowElement', name: 'x', attributes: [], children: []},
          {extensions: [mdxJsxToMarkdown({tightSelfClosing: true})]}
        ),
        '<x/>\n'
      )
    }
  )

  await t.test(
    'should support attributes on one line up to the given `options.printWidth`',
    async function () {
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
        '<x y="aaa" z="aa" />\n'
      )
    }
  )

  await t.test(
    'should support attributes on separate lines up to the given `options.printWidth`',
    async function () {
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
        '<x\n  y="aaa"\n  z="aaa"\n/>\n'
      )
    }
  )

  await t.test(
    'should support attributes on separate lines if they contain line endings',
    async function () {
      assert.deepEqual(
        toMarkdown(
          {
            type: 'mdxJsxFlowElement',
            name: 'x',
            attributes: [
              {type: 'mdxJsxExpressionAttribute', value: '\n  ...a\n'}
            ],
            children: []
          },
          {extensions: [mdxJsxToMarkdown({printWidth: 20})]}
        ),
        '<x\n  {\n  ...a\n}\n/>\n'
      )
    }
  )
})

test('roundtrip', async function (t) {
  await t.test('should roundtrip `attribute`', async function () {
    equal('<a x="a\nb\nc" />', '<a\n  x="a\nb\nc"\n/>\n')
  })

  await t.test(
    'should roundtrip `attribute in nested element`',
    async function () {
      equal(
        '<a>\n<b x="a\nb\nc" />\n</a>',
        '<a>\n  <b\n    x="a\nb\nc"\n  />\n</a>\n'
      )
    }
  )

  await t.test(
    'should roundtrip `attribute in nested elements`',
    async function () {
      equal(
        '<a>\n  <b>\n    <c x="a\nb\nc" />\n  </b>\n</a>',
        '<a>\n  <b>\n    <c\n      x="a\nb\nc"\n    />\n  </b>\n</a>\n'
      )
    }
  )

  await t.test('should roundtrip `attribute expression`', async function () {
    equal('<a x={`a\nb\nc`} />', '<a\n  x={`a\nb\nc`}\n/>\n')
  })

  await t.test(
    'should roundtrip `attribute expression in nested element`',
    async function () {
      equal(
        '<a>\n<b x={`a\nb\nc`} />\n</a>',
        '<a>\n  <b\n    x={`a\nb\nc`}\n  />\n</a>\n'
      )
    }
  )

  await t.test(
    'should roundtrip `attribute expression in nested elements`',
    async function () {
      equal(
        '<a>\n  <b>\n    <c x={`a\nb\nc`} />\n  </b>\n</a>',
        '<a>\n  <b>\n    <c\n      x={`a\nb\nc`}\n    />\n  </b>\n</a>\n'
      )
    }
  )

  await t.test('should roundtrip `expression`', async function () {
    equal('<a {\n...a\n} />', '<a\n  {\n...a\n}\n/>\n')
  })

  await t.test(
    'should roundtrip `expression in nested element`',
    async function () {
      equal(
        '<a>\n<b {\n...a\n} />\n</a>',
        '<a>\n  <b\n    {\n...a\n}\n  />\n</a>\n'
      )
    }
  )

  await t.test(
    'should roundtrip `expression in nested elements`',
    async function () {
      equal(
        '<a>\n  <b>\n    <c {\n...a\n} />\n  </b>\n</a>',
        '<a>\n  <b>\n    <c\n      {\n...a\n}\n    />\n  </b>\n</a>\n'
      )
    }
  )

  await t.test(
    'should roundtrip `children in nested elements`',
    async function () {
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
`
      )
    }
  )

  await t.test(
    'should roundtrip `text children in flow elements`',
    async function () {
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
`
      )
    }
  )

  await t.test('should roundtrip `nested JSX and lists`', async function () {
    const source = `<x>
  * Alpha

    <y>
      * Bravo

        <z>
          <a>
            * Charlie

              * Delta

                <b>
                  Echo
                </b>

              <b>
                Foxtrot
              </b>
          </a>
        </z>
    </y>

  <y>
    <z>
      Golf
    </z>
  </y>
</x>
`
    equal(source, source)
  })

  await t.test(
    'should roundtrip `nested JSX and block quotes`',
    async function () {
      const source = `<x>
  > Alpha
  >
  > <y>
  >   > Bravo
  >   >
  >   > <z>
  >   >   <a>
  >   >     > Charlie
  >   >     >
  >   >     > > Delta
  >   >     > >
  >   >     > > <b>
  >   >     > >   Echo
  >   >     > > </b>
  >   >     >
  >   >     > <b>
  >   >     >   Foxtrot
  >   >     > </b>
  >   >   </a>
  >   > </z>
  > </y>

  <y>
    <z>
      Golf
    </z>
  </y>
</x>
`
      equal(source, source)
    }
  )
})

/**
 * @param {string} input
 * @param {string} output
 */
function equal(input, output) {
  const intermediate1 = process(input)
  assert.equal(intermediate1, output, '#1')
  const intermediate2 = process(intermediate1)
  assert.equal(intermediate2, output, '#2')
  const intermediate3 = process(intermediate2)
  assert.equal(intermediate3, output, '#3')
  const intermediate4 = process(intermediate3)
  assert.equal(intermediate4, output, '#4')
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
