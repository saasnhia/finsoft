import { Composition } from 'remotion'
import { WorthifastTestimonial } from './WorthifastTestimonial'
import { WorthifastAd15s } from './WorthifastAd15s'
import { WorthifastAd15sPRO } from './WorthifastAd15sPRO'

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="WorthifastTestimonial"
        component={WorthifastTestimonial}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="WorthifastAd15s"
        component={WorthifastAd15s}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
      <Composition
        id="WorthifastAd15sPRO"
        component={WorthifastAd15sPRO}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  )
}
