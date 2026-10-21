import Link from "next/link";

export default function NepaliFooter() { return <footer className="footer"><div className="brand"><span className="brand-mark">T</span><span>Trinity <em>Classes</em></span></div><div><Link href="/subscriptions">सदस्यता</Link> · <Link href="/educators">शिक्षकहरू</Link> · <Link href="/profile">प्रोफाइल</Link></div><span>सिकाइलाई आफ्नो गतिमा अगाडि बढाउनुहोस्।</span></footer>; }
