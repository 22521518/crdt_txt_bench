import * as React from "react"
import { concatClassCSS } from "@/libs/components.utils"
import "./input.scss"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} className={concatClassCSS("tiptap-input", className)} {...props} />
  )
}

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={concatClassCSS("tiptap-input-group", className)} {...props}>
      {children}
    </div>
  )
}

export { Input, InputGroup }
