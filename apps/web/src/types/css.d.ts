// Type declarations for CSS imports in Next.js
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss.module' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass.module' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}
