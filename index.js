/**
 * @typedef {import('mdast').Literal} Literal
 * @typedef {import('mdast').Parent} Parent
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-from-markdown').Token} Token
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('estree-jsx').Program} Estree
 *
 * @typedef {Literal & {type: 'mdxJsxAttributeValueExpression', data?: {estree?: Estree}}} MDXJsxAttributeValueExpression
 * @typedef {Omit<Literal, 'value'> & {type: 'mdxJsxAttribute', name: string, value: MDXJsxAttributeValueExpression|string|null}} MDXJsxAttribute
 * @typedef {Literal & {type: 'mdxJsxExpressionAttribute'}} MDXJsxExpressionAttribute
 * @typedef {MDXJsxAttribute|MDXJsxExpressionAttribute} Attribute
 * @typedef {{name: string|null, attributes: Attribute[], close?: boolean, selfClosing?: boolean, start: Token['start'], end: Token['start']}} Tag
 *
 * @typedef {{name: string|null, attributes: Attribute[]}} MDXJsxElement
 * @typedef {Parent & MDXJsxElement & {type: 'mdxJsxFlowElement'}} MDXJsxFlowElement
 * @typedef {Parent & MDXJsxElement & {type: 'mdxJsxTextElement'}} MDXJsxTextElement
 */

import {parseEntities} from 'parse-entities'
import {stringifyPosition} from 'unist-util-stringify-position'
import {VFileMessage} from 'vfile-message'
import {stringifyEntitiesLight} from 'stringify-entities'
import {containerFlow} from 'mdast-util-to-markdown/lib/util/container-flow.js'
import {containerPhrasing} from 'mdast-util-to-markdown/lib/util/container-phrasing.js'
import {checkQuote} from 'mdast-util-to-markdown/lib/util/check-quote.js'

const eol = /\r?\n|\r/g

mdxElement.peek = peekElement

/** @type {FromMarkdownExtension} */
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

/** @type {ToMarkdownExtension} */
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

/** @type {FromMarkdownHandle} */
function buffer() {
  this.buffer()
}

/** @type {FromMarkdownHandle} */
function data(token) {
  this.config.enter.data.call(this, token)
  this.config.exit.data.call(this, token)
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTag(token) {
  /** @type {Tag} */
  const tag = {name: null, attributes: [], start: token.start, end: token.end}
  if (!this.getData('mdxJsxTagStack')) this.setData('mdxJsxTagStack', [])
  this.setData('mdxJsxTag', tag)
  this.buffer()
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTagClosingMarker(token) {
  /** @type {Tag[]} */
  // @ts-expect-error: hush
  const stack = this.getData('mdxJsxTagStack')

  if (stack.length === 0) {
    throw new VFileMessage(
      'Unexpected closing slash `/` in tag, expected an open tag first',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-closing-slash'
    )
  }
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTagAnyAttribute(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')

  if (tag.close) {
    throw new VFileMessage(
      'Unexpected attribute in closing tag, expected the end of the tag',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-attribute'
    )
  }
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTagSelfClosingMarker(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')

  if (tag.close) {
    throw new VFileMessage(
      'Unexpected self-closing slash `/` in closing tag, expected the end of the tag',
      {start: token.start, end: token.end},
      'mdast-util-mdx-jsx:unexpected-self-closing-slash'
    )
  }
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagClosingMarker() {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.close = true
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagNamePrimary(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.name = this.sliceSerialize(token)
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagNameMember(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.name += '.' + this.sliceSerialize(token)
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagNameLocal(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.name += ':' + this.sliceSerialize(token)
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTagAttribute(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  enterMdxJsxTagAnyAttribute.call(this, token)
  tag.attributes.push({type: 'mdxJsxAttribute', name: '', value: null})
}

/** @type {FromMarkdownHandle} */
function enterMdxJsxTagExpressionAttribute(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  enterMdxJsxTagAnyAttribute.call(this, token)
  tag.attributes.push({type: 'mdxJsxExpressionAttribute', value: ''})
  this.buffer()
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagExpressionAttribute(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  /** @type {MDXJsxExpressionAttribute} */
  // @ts-expect-error: hush
  const tail = tag.attributes[tag.attributes.length - 1]
  /** @type {Estree?} */
  // @ts-expect-error: custom.
  const estree = token.estree

  tail.value = this.resume()

  if (estree) {
    tail.data = {estree}
  }
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagAttributeNamePrimary(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.attributes[tag.attributes.length - 1].name = this.sliceSerialize(token)
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagAttributeNameLocal(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.attributes[tag.attributes.length - 1].name +=
    ':' + this.sliceSerialize(token)
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagAttributeValueLiteral() {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  tag.attributes[tag.attributes.length - 1].value = parseEntities(
    this.resume(),
    {nonTerminated: false}
  )
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagAttributeValueExpression(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  /** @type {MDXJsxAttribute} */
  // @ts-expect-error: hush
  const tail = tag.attributes[tag.attributes.length - 1]
  /** @type {MDXJsxAttributeValueExpression} */
  const node = {type: 'mdxJsxAttributeValueExpression', value: this.resume()}
  /** @type {Estree?} */
  // @ts-expect-error: custom.
  const estree = token.estree

  if (estree) {
    node.data = {estree}
  }

  tail.value = node
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTagSelfClosingMarker() {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')

  tag.selfClosing = true
}

/** @type {FromMarkdownHandle} */
function exitMdxJsxTag(token) {
  /** @type {Tag} */
  // @ts-expect-error: hush
  const tag = this.getData('mdxJsxTag')
  /** @type {Tag[]} */
  // @ts-expect-error: hush
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
    /** @type {MDXJsxFlowElement|MDXJsxTextElement} */
    const node = {
      type:
        token.type === 'mdxJsxTextTag'
          ? 'mdxJsxTextElement'
          : 'mdxJsxFlowElement',
      name: tag.name,
      attributes: tag.attributes,
      children: []
    }

    // @ts-expect-error: custom
    this.enter(node, token)
  }

  if (tag.selfClosing || tag.close) {
    this.exit(token)
  } else {
    stack.push(tag)
  }
}

/**
 * Serialize a tag, excluding attributes.
 * `self-closing` is not supported, because we don’t need it yet.
 *
 * @param {Tag} tag
 * @returns {string}
 */
function serializeAbbreviatedTag(tag) {
  return '<' + (tag.close ? '/' : '') + (tag.name || '') + '>'
}

/**
 * @type {ToMarkdownHandle}
 * @param {MDXJsxFlowElement|MDXJsxTextElement} node
 */
// eslint-disable-next-line complexity
function mdxElement(node, _, context) {
  const selfClosing =
    node.name && (!node.children || node.children.length === 0)
  const quote = checkQuote(context)
  const exit = context.enter(node.type)
  let index = -1
  /** @type {Array.<string>} */
  const attributes = []
  /** @type {string} */
  let result

  // None.
  if (node.attributes && node.attributes.length > 0) {
    if (!node.name) {
      throw new Error('Cannot serialize fragment w/ attributes')
    }

    while (++index < node.attributes.length) {
      const attribute = node.attributes[index]

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
        ? '\n' + indent(containerFlow(node, context)) + '\n'
        : containerPhrasing(node, context, {before: '<', after: '>'})
      : '') +
    (selfClosing ? '' : '</' + (node.name || '') + '>')

  exit()
  return value
}
/**
 * @type {ToMarkdownHandle}
 */

function peekElement() {
  return '<'
}

/**
 * @param {string} value
 * @returns {string}
 */
function dedentStart(value) {
  return value.replace(/^ +/, '')
}

/**
 * @param {string} value
 * @returns {string}
 */
function indent(value) {
  /** @type {Array.<string>} */
  const result = []
  let start = 0
  /** @type {RegExpExecArray|null} */
  let match

  while ((match = eol.exec(value))) {
    one(value.slice(start, match.index))
    result.push(match[0])
    start = match.index + match[0].length
  }

  one(value.slice(start))

  return result.join('')

  /**
   * @param {string} slice
   * @returns {void}
   */
  function one(slice) {
    result.push((slice ? '  ' : '') + slice)
  }
}
