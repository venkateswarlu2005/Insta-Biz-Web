import type { CSSProperties } from 'react';
import { PupBuddy, type PupFacing, type PupPose } from '@/components/pup/PupBuddy';

type Props = {
  pose?: PupPose;
  facing?: PupFacing;
  /** what Teddy does when he arrives here: "basket", "peekaboo", "tilt", "treadmill" */
  act?: string;
  /** Teddy sits behind scenery here (e.g. inside the basket): he hops in and out */
  behind?: boolean;
  /** a stop on the phone "lane" (the only stops used below 768px) */
  lane?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * A place on the page where Teddy can be. PupJourney walks the single on-screen
 * teddy between stops as you scroll; each stop renders its own resting teddy as a fallback
 * (hidden by CSS via html[data-pup] while the journey runs).
 */
export function PupStop({ pose = 'sit', facing = 'right', act, behind, lane, label, className = '', style }: Props) {
  return (
    <div
      data-pup-stop="true"
      data-pose={pose}
      data-facing={facing}
      data-act={act}
      data-behind={behind || undefined}
      data-lane={lane || undefined}
      className={`pup-stop ${className}`}
      style={style}
    >
      <PupBuddy pose={pose} facing={facing} label={label} asStop />
    </div>
  );
}
