03/11/2026: richtext-editor* components not work due to unpropper refactoring
***commit: 27fe7062f74e30d565b1ff0da26ba3a5b7c9da74 ***
***commit: 65c58e573dba4249f9a8e7d1eead4ca8867eb60f ***
# Nguyên nhân:
component richtext-editor-content.tsx không thể mount vào DOM để chỉnh sửa được doc gồm các điểm mấu chốt sau:
1. Cơ chế mount/unmount của Tiptap:
Khi khởi tạo Tiptap new Editor(...), Tiptap đã tạo sẵn EditorView (ProseMirror) bên trong một thẻ div tách rời (detached element).
@tiptap/react mount vào DOM bằng cách chuyển các node con của editor.view.dom.parentNode vào element container, rồi gọi editor.setOptions({ element }) và editor.createNodeViews().
Việc gọi editor.unmount() trước khi mount sẽ gọi editorView.destroy(), huỷ hoàn toàn view và gán editorView = null, khiến Tiptap coi như đã bị destroyed và không thể tương tác/focus được nữa.

2. Wrapper không được memoize gây remount liên tục mỗi lần gõ:
Trong useCreateTipTapEditor, một object literal mới được trả về ở mỗi lượt render.
Trong EditorContentWithKey, useMemo(() => ..., [props.editor]) phát hiện reference object thay đổi liên tục, sinh ra key mới ở mỗi lượt gõ hoặc focus, khiến React huỷ và tạo lại PureEditorContent liên tục, làm mất focus và không thể soạn thảo.

# Mitigation:
1. Đóng gói logic mount/unmount DOM chuẩn của Tiptap vào phương thức mount(element) và unmount() của RichTextWrapper:
```js
mount(element: HTMLElement) {
  if (!editor || editor.isDestroyed) return

  if (editor.view?.dom?.parentNode) {
    element.append(...editor.view.dom.parentNode.childNodes)
    editor.setOptions({ element })
    editor.createNodeViews()
  } else {
    editor.mount(element)
  }
},
unmount() {
  if (!editor || editor.isDestroyed) return

  try {
    if (!editor.view?.dom?.parentNode) return
    const newElement = document.createElement('div')
    newElement.append(...editor.view.dom.parentNode.childNodes)
    editor.setOptions({ element: newElement })
  } catch {
    // do nothing
  }
}
```
2. Sử dụng React.useMemo(() => ({ ... }), [editor]) để đảm bảo instance RichTextWrapper có reference ổn định trong suốt vòng đời của editor.
3. Thêm class richtxt-editor vào editorProps.attributes.class để nhận đúng styling từ richtext-editor.scss.