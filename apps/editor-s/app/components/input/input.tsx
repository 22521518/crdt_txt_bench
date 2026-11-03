import * as React from "react"
import { concat_cls } from "@/libs/components.utils"
import "./input.scss"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} className={concat_cls("tiptap-input", className)} {...props} />
  )
}

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={concat_cls("tiptap-input-group", className)} {...props}>
      {children}
    </div>
  )
}

export { Input, InputGroup }
