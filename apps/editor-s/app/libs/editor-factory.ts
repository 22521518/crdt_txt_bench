
// export const createTiptapEditor = () =>  useEditor({
//   immediatelyRender: false,
//   shouldRerenderOnTransaction: false,
//   editorProps: {
//     attributes: {
//       autocomplete: "off",
//       autocorrect: "off",
//       autocapitalize: "off",
//       "aria-label": "Main content area, start typing to enter text.",
//       class: "richtxt-editor",
//     },
//   },
//   extensions: [
//     StarterKit.configure({
//       horizontalRule: false,
//       link: {
//         openOnClick: false,
//         enableClickSelection: true,
//       },
//     }),
//     HorizontalRule,
//     TextAlign.configure({ types: ["heading", "paragraph"] }),
//     TaskList,
//     TaskItem.configure({ nested: true }),
//     Highlight.configure({ multicolor: true }),
//     Image,
//     Typography,
//     Superscript,
//     Subscript,
//     Selection,
//     ImageUploadNode.configure({
//       accept: "image/*",
//       maxSize: MAX_FILE_SIZE,
//       limit: 3,
//       upload: handleImageUpload,
//       onError: (error) => console.error("Upload failed:", error),
//     }),
//   ],
//   content,
// })