import type {Node} from 'unist'
import type {Parent, Literal, BlockContent, PhrasingContent} from 'mdast'
import type {Program} from 'estree-jsx'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxJsxAttributeValueExpression extends Literal {
  type: 'mdxJsxAttributeValueExpression'
  data?: {estree?: Program} & Literal['data']
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxJsxAttribute extends Node {
  type: 'mdxJsxAttribute'
  name: string
  value?: MdxJsxAttributeValueExpression | string | null
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxJsxExpressionAttribute extends Literal {
  type: 'mdxJsxExpressionAttribute'
  data?: {estree?: Program} & Literal['data']
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface MdxJsxElementFields {
  name: string | null
  attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxJsxFlowElement extends MdxJsxElementFields, Parent {
  type: 'mdxJsxFlowElement'
  children: BlockContent[]
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxJsxTextElement extends MdxJsxElementFields, Parent {
  type: 'mdxJsxTextElement'
  children: PhrasingContent[]
}

declare module 'mdast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface StaticPhrasingContentMap {
    mdxJsxTextElement: MdxJsxTextElement
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface BlockContentMap {
    mdxJsxFlowElement: MdxJsxFlowElement
  }
}

declare module 'hast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface RootContentMap {
    mdxJsxTextElement: MdxJsxTextElement
    mdxJsxFlowElement: MdxJsxFlowElement
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ElementContentMap {
    mdxJsxTextElement: MdxJsxTextElement
    mdxJsxFlowElement: MdxJsxFlowElement
  }
}
