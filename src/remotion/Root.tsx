import { Composition } from 'remotion'
import { WorthifastTestimonial } from './WorthifastTestimonial'

export function RemotionRoot() {
  return (
    <Composition
      id="WorthifastTestimonial"
      component={WorthifastTestimonial}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  )
}
