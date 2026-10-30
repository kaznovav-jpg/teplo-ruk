// 카탈로그(상품·작가·클래스·아티클·일정)는 정적 JSON입니다. 추후 Firestore 컬렉션으로 옮기려면 이 파일만 바꾸면 됩니다.
import products from '../data/products.json'
import artists from '../data/artists.json'
import classes from '../data/classes.json'
import articles from '../data/articles.json'
import posts from '../data/posts.json'
import extras from '../data/extras.json'
export const D = { products, artists, classes, articles, posts, extras }
