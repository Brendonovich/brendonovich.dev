import { createMemo, createSignal, onCleanup } from "solid-js";

function getWindow() {
  return typeof window !== "undefined" ? window : null;
}

const remInPx = (rem: number) =>
  rem * parseFloat(getComputedStyle(document.body).fontSize);

export default function Welcome() {
  const [scroll, setScroll] = createSignal(getWindow()?.scrollY ?? 0);
  const window = getWindow();
  if (!window) return null;

  const listener = () => {
    setScroll(getWindow()?.scrollY ?? 0);
  };

  getWindow()?.addEventListener("scroll", listener);
  onCleanup(() => getWindow()?.removeEventListener("scroll", listener));

  function animate(
    from: number,
    to: number,
    start: number,
    end: number,
    t: number
  ) {
    if (t <= start) return from;
    if (t >= end) return to;
    return from + ((to - from) * (t - start)) / (end - start);
  }

  const scrollPercentage = createMemo(
    () => scroll() / (getWindow()?.innerHeight ?? 1)
  );

  const headingSize = createMemo(() =>
    animate(6, 3, 0.1, 0.3, scrollPercentage())
  );

  return (
    <>
      {scroll() > (window.innerHeight - remInPx(3)) / 2 + remInPx(0.5) && (
        <div class="bg-neutral-900 z-10 text-yellow-400 text-center font-black w-full fixed leading-none top-0 py-2 text-[3rem] border-b border-neutral-800 border-opacity-100 transition-opacity">
          Brendan
        </div>
      )}
      <div class="text-center font-black leading-none">
        <div class="h-32 flex flex-col justify-end">
          <h1
            class="text-white"
            style={{
              "font-size": `${headingSize()}rem`,
            }}
          >
            {"Hey, I'm "}
          </h1>
        </div>
        <div
          class="text-yellow-400 sticky top-2"
          style={{ "font-size": `${headingSize()}rem` }}
        >
          Brendan
        </div>
        <div class="h-32 pt-8"></div>
      </div>
    </>
  );
}
