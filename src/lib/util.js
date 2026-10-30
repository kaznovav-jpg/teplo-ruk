export const COLORS = { 아이보리: '#F3EBDD', 베이지: '#D9C3A5', 테라코타: '#B5573A', 세이지: '#9AA88A', 차콜: '#3A3733', 머스터드: '#D1A545' }
export const CATS = [['bag', '가방·바느질', '👜'], ['knit', '뜨개질', '🧶'], ['felt', '펠트·양모펠트', '🐑'], ['clothes', '수제 옷', '👗'], ['deco', '데코·데코파주', '🖼️']]
export const BOARDS = [['wip', '작업과정(WIP) 포토'], ['show', '자랑하기'], ['qa', '질문·답변'], ['free', '자유게시판']]
export const isPhoto = (b) => b === 'wip' || b === 'show'
export const FREE_SHIP = 30000
export const SHIP = 3000
export const won = (n) => n.toLocaleString('ko-KR') + '원'
export const dFmt = (iso) => new Date(iso).toLocaleDateString('ko-KR')
export const artistName = (D, id) => D.artists.find((a) => a.id === id)?.name || ''

// 이미지를 불러오지 못할 때 보여줄 내장 플레이스홀더(SVG)
export function ph(seed, w = 600, h = 750) {
  let n = 0
  for (const c of String(seed)) n = (n * 31 + c.charCodeAt(0)) >>> 0
  const P = [['#EDE3D3', '#D9C3A5'], ['#F3EBDD', '#DDC7B0'], ['#E4E8DA', '#B9C4A8'], ['#F1DDD2', '#D9A58C'], ['#E9E0D2', '#C9B79C']][n % 5]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * (0.3 + (n % 5) * 0.1)}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.22}" fill="#fff" opacity=".35"/><rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" rx="${w * 0.03}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 9" opacity=".7"/></svg>`
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

// 업로드 전 이미지를 가로 600px JPEG로 줄입니다.
export const shrink = (f) => new Promise((res) => {
  const fr = new FileReader()
  fr.onload = () => {
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, 600 / im.width), c = document.createElement('canvas')
      c.width = im.width * k; c.height = im.height * k
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.7))
    }
    im.src = fr.result
  }
  fr.readAsDataURL(f)
})
