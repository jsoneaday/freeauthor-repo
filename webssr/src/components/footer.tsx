export default function Footer() {
  return (
    <footer className="footer md:px-10 px-5 py-4 border-t border-base-300 flex flex-col lg:flex-row justify-between items-center">
      <p>Copyright © 2024 - All rights reserved</p>

      <div className="flex items-center">
        <svg
          className="h-6 w-6"
          width="32"
          height="32"
          viewBox="0 0 415 415"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="82.5"
            y="290"
            width="250"
            height="125"
            rx="62.5"
            fill="#1AD1A5"
          ></rect>
          <circle
            cx="207.5"
            cy="135"
            r="130"
            fill="black"
            fillOpacity=".3"
          ></circle>
          <circle cx="207.5" cy="135" r="125" fill="white"></circle>
          <circle cx="207.5" cy="135" r="56" fill="#FF9903"></circle>
        </svg>
      </div>

      <nav className="md:place-self-center md:justify-self-end">
        <div className="grid grid-flow-col gap-4">
          <ul className="menu menu-horizontal px-1 gap-5 md:text-lg font-semibold">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/blog">Articles</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </div>
      </nav>
    </footer>
  );
}
