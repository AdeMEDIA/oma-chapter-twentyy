import { imageVariants } from '../data/imageVariants';

// Source files stay untouched. Browsers that support WebP select a derivative
// appropriate to the rendered size and device pixel ratio.
export default function ResponsiveImage({ src, sizes = '100vw', ...props }) {
  const variant = imageVariants[src];
  return <picture className="responsive-image">
    {variant && <source type="image/webp" srcSet={variant.srcSet} sizes={sizes} />}
    <img src={src} width={variant?.width} height={variant?.height} {...props} />
  </picture>;
}
