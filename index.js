import {parseEntities} from 'parse-entities'
import {stringifyPosition} from 'unist-util-stringify-position'
import {VFileMessage} from 'vfile-message'
import {stringifyEntitiesLight} from 'stringify-entities'
import flow from 'mdast-util-to-markdown/lib/util/container-flow.js'
import phrasing from 'mdast-util-to-markdown/lib/util/container-phrasing.js'
import checkQuote from 'mdast-util-to-markdown/lib/util/check-quote.js'

const eol = /\r?\n|\r/g

mdxElement.peek = peekElement

export const mdxJsxFromMarkdown = {
  canContainEols: ['mdxJsxTextElement'],
  enter: {
    mdxJsxFlowTag: enterMdxJsxTag,
    mdxJsxFlowTagClosingMarker: enterMdxJsxTagClosingMarker,
    mdxJsxFlowTagAttribute: enterMdxJsxTagAttribute,
    mdxJsxFlowTagExpressionAttribute: enterMdxJsxTagExpressionAttribute,
    mdxJsxFlowTagAttributeValueLiteral: buffer,
    mdxJsxFlowTagAttributeValueExpression: buffer,
    mdxJsxFlowTagSelfClosingMarker: enterMdxJsxTagSelfClosingMarker,

    mdxJsxTextTag: enterMdxJsxTag,
    mdxJsxTextTagClosingMarker: enterMdxJsxTagClosingMarker,
    mdxJsxTextTagAttribute: enterMdxJsxTagAttribute,
    mdxJsxTextTagExpressionAttribute: enterMdxJsxTagExpressionAttribute,
    mdxJsxTextTagAttributeValueLiteral: buffer,
    mdxJsxTextTagAttributeValueExpression: buffer,
    mdxJsxTextTagSelfClosingMarker: enterMdxJsxTagSelfClosingMarker
  },
  exit: {
    mdxJsxFlowTagClosingMarker: exitMdxJsxTagClosingMarker,
    mdxJsxFlowTagNamePrimary: exitMdxJsxTagNamePrimary,
    mdxJsxFlowTagNameMember: exitMdxJsxTagNameMember,
    mdxJsxFlowTagNameLocal: exitMdxJsxTagNameLocal,
    mdxJsxFlowTagExpressionAttribute: exitMdxJsxTagExpressionAttribute,
    mdxJsxFlowTagExpressionAttributeValue: data,
    mdxJsxFlowTagAttributeNamePrimary: exitMdxJsxTagAttributeNamePrimary,
    mdxJsxFlowTagAttributeNameLocal: exitMdxJsxTagAttributeNameLocal,
    mdxJsxFlowTagAttributeValueLiteral: exitMdxJsxTagAttributeValueLiteral,
    mdxJsxFlowTagAttributeValueLiteralValue: data,
    mdxJsxFlowTagAttributeValueExpression:
      exitMdxJsxTagAttributeValueExpression,
    mdxJsxFlowTagAttributeValueExpressionValue: data,
    mdxJsxFlowTagSelfClosingMarker: exitMdxJsxTagSelfClosingMarker,
    mdxJsxFlowTag: exitMdxJsxTag,

    mdxJsxTextTagClosingMarker: exitMdxJsxTagClosingMarker,
    mdxJsxTextTagNamePrimary: exitMdxJsxTagNamePrimary,
    mdxJsxTextTagNameMember: exitMdxJsxTagNameMember,
    mdxJsxTextTagNameLocal: exitMdxJsxTagNameLocal,
    mdxJsxTextTagExpressionAttribute: exitMdxJsxTagExpressionAttribute,
    mdxJsxTextTagExpressionAttributeValue: data,
    mdxJsxTextTagAttributeNamePrimary: exitMdxJsxTagAttributeNamePrimary,
    mdxJsxTextTagAttributeNameLocal: exitMdxJsxTagAttributeNameLocal,
    mdxJsxTextTagAttributeValueLiteral: exitMdxJsxTagAttributeValueLiteral,
    mdxJsxTextTagAttributeValueLiteralValue: data,
    mdxJsxTextTagAttributeValueExpression:
      exitMdxJsxTagAttributeValueExpression,
    mdxJsxTextTagAttributeValueExpressionValue: data,
    mdxJsxTextTagSelfClosingMarker: exitMdxJsxTagSelfClosingMarker,
    mdxJsxTextTag: exitMdxJsxTag
  }
}

export const mdxJsxToMarkdown = {
  handlers: {
    mdxJsxFlowElement: mdxElement,
    mdxJsxTextElement: mdxElement
  },
  unsafe: [
    {character: '<', inConstruct: ['phrasing']},
    {atBreak: true, character: '<'}
  ],
  fences: true,
  resourceLink: true
}

function buffer() {
  this.buffer()
}

function data(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

function enterMdxJsxTag(token) {
  if (!this.getData('mdxJsxTagStack')) this.setData('mdxJsxTagStack', [])

  this.setData('mdxJsxTag', {
    name: null,
    attributes: [],
    start: token.start,
    end: token.end
  })

  this.buffer()
}

function enterMdxJsxTagClosingMarker(token) {
  if (this.getData('mdxJsxTagStack').length === 0) {
    throw new VFileMessage(
      'Unexpected closing slash `/` in tag, expected an open tag first',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-closing-slash'
    )
  }
}

function enterMdxJsxTagAnyAttribute(token) {
  if (this.getData('mdxJsxTag').close) {
    throw new VFileMessage(
      'Unexpected attribute in closing tag, expected the end of the tag',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-attribute'
    )
  }
}

function enterMdxJsxTagSelfClosingMarker(token) {
  if (this.getData('mdxJsxTag').close) {
    throw new VFileMessage(
      'Unexpected self-closing slash `/` in closing tag, expected the end of the tag',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-self-closing-slash'
    )
  }
}

function exitMdxJsxTagClosingMarker() {
  this.getData('mdxJsxTag').close = true
}

function exitMdxJsxTagNamePrimary(token) {
  this.getData('mdxJsxTag').name = this.sliceSerialize(token)
}

function exitMdxJsxTagNameMember(token) {
  this.getData('mdxJsxTag').name += '.' + this.sliceSerialize(token)
}

function exitMdxJsxTagNameLocal(token) {
  this.getData('mdxJsxTag').name += ':' + this.sliceSerialize(token)
}

function enterMdxJsxTagAttribute(token) {
  enterMdxJsxTagAnyAttribute.call(this, token)
  this.getData('mdxJsxTag').attributes.push({
    type: 'mdxJsxAttribute',
    name: null,
    value: null
  })
}

function enterMdxJsxTagExpressionAttribute(token) {
  enterMdxJsxTagAnyAttribute.call(this, token)
  this.getData('mdxJsxTag').attributes.push({
    type: 'mdxJsxExpressionAttribute',
    value: null
  })
  this.buffer()
}

function exitMdxJsxTagExpressionAttribute(token) {
  const attributes = this.getData('mdxJsxTag').attributes
  attributes[attributes.length - 1].value = this.resume()

  if (token.estree) {
    attributes[attributes.length - 1].data = {estree: token.estree}
  }
}

function exitMdxJsxTagAttributeNamePrimary(token) {
  const attributes = this.getData('mdxJsxTag').attributes
  attributes[attributes.length - 1].name = this.sliceSerialize(token)
}

function exitMdxJsxTagAttributeNameLocal(token) {
  const attributes = this.getData('mdxJsxTag').attributes
  attributes[attributes.length - 1].name += ':' + this.sliceSerialize(token)
}

function exitMdxJsxTagAttributeValueLiteral() {
  const attributes = this.getData('mdxJsxTag').attributes
  attributes[attributes.length - 1].value = parseEntities(this.resume(), {
    nonTerminated: false
  })
}

function exitMdxJsxTagAttributeValueExpression(token) {
  const attributes = this.getData('mdxJsxTag').attributes

  attributes[attributes.length - 1].value = {
    type: 'mdxJsxAttributeValueExpression',
    value: this.resume()
  }

  if (token.estree) {
    attributes[attributes.length - 1].value.data = {estree: token.estree}
  }
}

function exitMdxJsxTagSelfClosingMarker() {
  this.getData('mdxJsxTag').selfClosing = true
}

function exitMdxJsxTag(token) {
  const tag = this.getData('mdxJsxTag')
  const stack = this.getData('mdxJsxTagStack')
  const tail = stack[stack.length - 1]

  if (tag.close && tail.name !== tag.name) {
    throw new VFileMessage(
      'Unexpected closing tag `' +
        serializeAbbreviatedTag(tag) +
        '`, expected corresponding closing tag for `' +
        serializeAbbreviatedTag(tail) +
        '` (' +
        stringifyPosition(tail) +
        ')',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:end-tag-mismatch'
    )
  }

  // End of a tag, so drop the buffer.
  this.resume()

  if (tag.close) {
    stack.pop()
  } else {
    this.enter(
      {
        type:
          token.type === 'mdxJsxTextTag'
            ? 'mdxJsxTextElement'
            : 'mdxJsxFlowElement',
        name: tag.name,
        attributes: tag.attributes,
        children: []
      },
      token
    )
  }

  if (tag.selfClosing || tag.close) {
    this.exit(token)
  } else {
    stack.push(tag)
  }
}

// Serialize a tag, excluding attributes.
// `self-closing` is not supported, because we don’t need it yet.
function serializeAbbreviatedTag(tag) {
  return '<' + (tag.close ? '/' : '') + (tag.name || '') + '>'
}

// eslint-disable-next-line complexity
function mdxElement(node, _, context) {
  const selfClosing =
    node.name && (!node.children || node.children.length === 0)
  const quote = checkQuote(context)
  const exit = context.enter(node.type)
  let index = -1
  const attributes = []
  let attribute
  let result

  // None.
  if (node.attributes && node.attributes.length > 0) {
    if (!node.name) {
      throw new Error('Cannot serialize fragment w/ attributes')
    }

    while (++index < node.attributes.length) {
      attribute = node.attributes[index]

      if (attribute.type === 'mdxJsxExpressionAttribute') {
        result = '{' + (attribute.value || '') + '}'
      } else {
        if (!attribute.name) {
          throw new Error('Cannot serialize attribute w/o name')
        }

        result =
          attribute.name +
          (attribute.value === undefined || attribute.value === null
            ? ''
            : '=' +
              (typeof attribute.value === 'object'
                ? '{' + (attribute.value.value || '') + '}'
                : quote +
                  stringifyEntitiesLight(attribute.value, {subset: [quote]}) +
                  quote))
      }

      attributes.push(result)
    }
  }

  const value =
    '<' +
    (node.name || '') +
    (node.type === 'mdxJsxFlowElement' && attributes.length > 1
      ? // Flow w/ multiple attributes.
        '\n' + indent(attributes.join('\n')) + '\n'
      : attributes.length > 0 // Text or flow w/ a single attribute.
      ? ' ' + dedentStart(indent(attributes.join(' ')))
      : '') +
    (selfClosing ? '/' : '') +
    '>' +
    (node.children && node.children.length > 0
      ? node.type === 'mdxJsxFlowElement'
        ? '\n' + indent(flow(node, context)) + '\n'
        : phrasing(node, context, {before: '<', after: '>'})
      : '') +
    (selfClosing ? '' : '</' + (node.name || '') + '>')

  exit()
  return value
}

function peekElement() {
  return '<'
}

function dedentStart(value) {
  return value.replace(/^ +/, '')
}

function indent(value) {
  const result = []
  let start = 0
  let match

  while ((match = eol.exec(value))) {
    one(value.slice(start, match.index))
    result.push(match[0])
    start = match.index + match[0].length
  }

  one(value.slice(start))

  return result.join('')

  function one(slice) {
    result.push((slice ? '  ' : '') + slice)
  }
}
