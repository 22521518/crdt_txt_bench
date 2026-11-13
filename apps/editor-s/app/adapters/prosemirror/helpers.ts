import type { Node, ParseOptions } from '@tiptap/pm/model'
import { DOMParser, Fragment, Schema } from '@tiptap/pm/model'
import type { Content } from '@/adapters/richtext-transaction'

/**
 * Create a new Prosemirror document node from content.
 * @param content The JSON or HTML content to create the document from
 * @param schema The Prosemirror schema to use for the document
 * @param parseOptions Options for the parser
 * @returns The created Prosemirror document node
 */
export function createDocument(
  content: Content | Node | Fragment,
  schema: Schema,
  parseOptions: ParseOptions = {},
  options: { errorOnInvalidContent?: boolean } = {},
): Node {
  return createNodeFromContent(content, schema, {
    slice: false,
    parseOptions,
    errorOnInvalidContent: options.errorOnInvalidContent,
  }) as Node
}


export type CreateNodeFromContentOptions = {
  slice?: boolean
  parseOptions?: ParseOptions
  errorOnInvalidContent?: boolean
}

/**
 * Takes a JSON or HTML content and creates a Prosemirror node or fragment from it.
 * @param content The JSON or HTML content to create the node from
 * @param schema The Prosemirror schema to use for the node
 * @param options Options for the parser
 * @returns The created Prosemirror node or fragment
 */
export function createNodeFromContent(
  content: Content | Node | Fragment,
  schema: Schema,
  options?: CreateNodeFromContentOptions,
): Node | Fragment {
  if (isProseMirrorContent(content)) {
    return content
  }

  const isJSONContent = typeof content === 'object' && content !== null

  options = {
    slice: true,
    parseOptions: {},
    ...options,
  }

  const isTextContent = typeof content === 'string'

  if (isJSONContent) {
    try {
      const isArrayContent = Array.isArray(content) && content.length > 0

      // if the JSON Content is an array of nodes, create a fragment for each node
      if (isArrayContent) {
        return Fragment.fromArray(content.map(item => schema.nodeFromJSON(item)))
      }

      const node = schema.nodeFromJSON(content)

      if (options.errorOnInvalidContent) {
        node.check()
      }

      return node
    } catch (error) {
      if (options.errorOnInvalidContent) {
        throw new Error('[tiptap error]: Invalid JSON content', { cause: error as Error })
      }

      console.warn('[tiptap warn]: Invalid content.', 'Passed value:', content, 'Error:', error)

      return createNodeFromContent('', schema, options)
    }
  }

  if (isTextContent) {
    // Check for invalid content
    if (options.errorOnInvalidContent) {
      let hasInvalidContent = false
      let invalidContent = ''

      // A copy of the current schema with a catch-all node at the end
      const contentCheckSchema = new Schema({
        topNode: schema.spec.topNode,
        marks: schema.spec.marks,
        // Prosemirror's schemas are executed such that: the last to execute, matches last
        // This means that we can add a catch-all node at the end of the schema to catch any content that we don't know how to handle
        nodes: schema.spec.nodes.append({
          __tiptap__private__unknown__catch__all__node: {
            content: 'inline*',
            group: 'block',
            parseDOM: [
              {
                tag: '*',
                getAttrs: e => {
                  // If this is ever called, we know that the content has something that we don't know how to handle in the schema
                  hasInvalidContent = true
                  // Try to stringify the element for a more helpful error message
                  invalidContent = typeof e === 'string' ? e : e.outerHTML
                  return null
                },
              },
            ],
          },
        }),
      })

      if (options.slice) {
        DOMParser.fromSchema(contentCheckSchema).parseSlice(
          elementFromString(content),
          options.parseOptions,
        )
      } else {
        DOMParser.fromSchema(contentCheckSchema).parse(
          elementFromString(content),
          options.parseOptions,
        )
      }

      if (options.errorOnInvalidContent && hasInvalidContent) {
        throw new Error('[tiptap error]: Invalid HTML content', {
          cause: new Error(`Invalid element found: ${invalidContent}`),
        })
      }
    }

    const parser = DOMParser.fromSchema(schema)

    if (options.slice) {
      return parser.parseSlice(elementFromString(content), options.parseOptions).content
    }

    return parser.parse(elementFromString(content), options.parseOptions)
  }

  return createNodeFromContent('', schema, options)
}


/**
 * Checks whether a value is already a ProseMirror node or fragment. Looks for the
 * `nodesBetween` method, because `instanceof` fails when prosemirror-model is loaded twice.
 * @param value Any value that could be passed as content
 * @returns True for a node or a fragment, false for JSON, HTML and everything else
 * @example ```js
 * isProseMirrorContent(editor.state.doc)
 * ```
 */
export function isProseMirrorContent(value: unknown): value is Node | Fragment {
  return typeof (value as Node | Fragment | undefined)?.nodesBetween === 'function'
}

const removeWhitespaces = (node: HTMLElement) => {
  const children = node.childNodes

  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i]

    if (child.nodeType === 3 && child.nodeValue && /^(\n\s\s|\n)$/.test(child.nodeValue)) {
      node.removeChild(child)
    } else if (child.nodeType === 1) {
      removeWhitespaces(child as HTMLElement)
    }
  }

  return node
}

export function elementFromString(value: string): HTMLElement {
  if (typeof window === 'undefined') {
    throw new Error(
      '[tiptap error]: there is no window object available, so this function cannot be used',
    )
  }
  // add a wrapper to preserve leading and trailing whitespace
  const wrappedValue = `<body>${value}</body>`

  const html = new window.DOMParser().parseFromString(wrappedValue, 'text/html').body

  return removeWhitespaces(html)
}
