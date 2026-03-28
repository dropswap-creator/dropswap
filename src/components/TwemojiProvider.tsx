'use client'

import { useEffect } from 'react'
import twemoji from 'twemoji'

export default function TwemojiProvider() {
  useEffect(() => {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
      className: 'twemoji',
    })

    const observer = new MutationObserver(() => {
      twemoji.parse(document.body, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        className: 'twemoji',
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
