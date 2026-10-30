import { useEffect } from 'react'
// 페이지마다 문서 제목을 바꿔 SEO·접근성을 돕습니다.
export default function useTitle(t) {
  useEffect(() => { document.title = (t ? t + ' | ' : '') + '손길의 온기' }, [t])
}
