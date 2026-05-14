export default function Logo({ className = "h-10" }) {
  return (
    <svg
      viewBox="0 0 220 90"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "auto" }}
    >
      {/* Red house shape */}
      <polygon points="30,5 6,30 6,75 54,75 54,30" fill="#A83030" />
      {/* White letters on house */}
      <text x="11" y="48" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="white">С</text>
      <text x="11" y="70" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="white">Д</text>
      {/* Black letters */}
      {/* <text x="56" y="48" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="28" fill="#111111" letterSpacing="-1">ТРОЙ</text> */}
      {/* <text x="56" y="76" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="28" fill="#111111" letterSpacing="-1">ВОР</text> */}
      <text x="56" y="48" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="28"  letterSpacing="-1">ТРОЙ</text>
      <text x="56" y="76" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="28"  letterSpacing="-1">ВОР</text>

    </svg>
  );
}
