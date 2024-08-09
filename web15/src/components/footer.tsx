import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer md:px-10 px-5 py-4 border-t border-base-300 flex flex-col lg:flex-row justify-between items-center">
      <p>Copyright © 2024 - All rights reserved</p>

      <div className="flex items-center"></div>

      <nav className="md:place-self-center md:justify-self-end">
        <div className="grid grid-flow-col gap-4">
          <ul className="menu menu-horizontal px-1 gap-5 md:text-lg font-semibold">
            <li>
              <Link href="/">Explore</Link>
            </li>
            <li>
              <Link href="/read">Read</Link>
            </li>
            <li>
              <Link href="/write">Write</Link>
            </li>
          </ul>
        </div>
      </nav>
    </footer>
  );
}
