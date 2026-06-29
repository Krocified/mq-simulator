export const WOBBLY = "255px 15px 225px 15px / 15px 225px 15px 255px";
export const WOBBLY_MD = "155px 25px 165px 25px / 25px 165px 25px 155px";
export const WOBBLY_SM = "65px 8px 70px 8px / 8px 70px 8px 65px";

export function wobblyStyle(r: string = WOBBLY_MD): React.CSSProperties {
  return { borderRadius: r };
}
