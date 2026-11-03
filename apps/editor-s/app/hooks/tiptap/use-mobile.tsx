import * as React from "react"

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < breakpoint)
    
    mediaQueryList.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < breakpoint)
    return () => mediaQueryList.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isMobile
}
