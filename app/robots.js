// Private site: tell every crawler to stay out (belt-and-braces with the X-Robots-Tag header).
export default function robots() {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
