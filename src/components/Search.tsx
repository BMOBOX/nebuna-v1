import { useEffect, useState, useRef } from "react";
import Link from "next/link";

function Search() {
  const [dat, setData] = useState("");
  const [com, setCom] = useState([]);
  const [visible, setVisible] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const show = () => setVisible(true);
  const hide = () => setTimeout(() => setVisible(false), 100);

  const clear = () => {
    setCom([]);
    setData("");
  };

  const handleLinkClick = (symbol: string) => {
    clear();
    window.location.href = `/stocks/${symbol}`;
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      if (dat.trim() !== "") {
        try {
          const res = await fetch(`/api/autoc/${dat}`, { signal });
          const result = await res.json();
          setCom(result.quotes || []);
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError")
            console.error(err);
        }
      } else {
        clear();
      }
    };

    const timeout = setTimeout(fetchData, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [dat]);

  // Adjust dropdown alignment
  useEffect(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setAlignRight(rect.right + 320 > window.innerWidth); // 320px ~ dropdown width
    }
  }, [dat, visible]);

  return (
    <div ref={wrapperRef} className="relative" onFocus={show}>
      {/* Input Box */}
      <label className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800 focus-within:border-blue-500 transition-all">
        <input
          type="text"
          placeholder="Search for stocks"
          className="bg-transparent outline-none text-white w-full placeholder-gray-400"
          onChange={(e) => setData(e.target.value)}
          value={dat}
          onBlur={hide}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clipRule="evenodd"
          />
        </svg>
      </label>

      {/* Results Box */}
      {visible && (
        <div
          className={`absolute mt-2 w-80 bg-zinc-900 border border-zinc-900 rounded-lg p-1 max-h-80 overflow-y-auto shadow-lg z-50 ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          {com.length > 0 ? (
            com.map(
              (item: any, index) =>
                item.shortname &&
                ![
                  "OPTION",
                  "ETF",
                  "MUTUALFUND",
                  "CRYPTOCURRENCY",
                  "FUTURE",
                ].includes(item.quoteType) && (
                  <Link
                    key={index}
                    href={`/stocks/${item.symbol}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.symbol);
                    }}
                    className="block px-3 py-2 text-white hover:bg-zinc-800 rounded-md transition"
                    prefetch
                  >
                    {item.shortname} ({item.symbol})
                  </Link>
                )
            )
          ) : (
            <div className="text-gray-500 px-3 py-2 w-full">No results</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
