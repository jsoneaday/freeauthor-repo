import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/blog" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50">
      <nav className="navbar bg-base-100/90 shadow-sm backdrop-blur-lg justify-center items-center py-2 md:px-10 px-5">
        <div className="navbar-start">
          <div className="dropdown">
            <button
              aria-label="button"
              tabIndex={0}
              role="button"
              className="btn btn-ghost lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                ></path>
              </svg>
            </button>
            <ul className="menu dropdown-content menu-md z-[1] mt-3 w-52 gap-2 rounded-box bg-base-100 p-2 shadow">
              {navigation.map((item) => (
                <li>
                  <a href={item.href}>{item.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <a className="btn btn-ghost text-xl" href="/">
            {" "}
            Blog
          </a>
        </div>
        <div className="navbar-center hidden lg:flex">
          {navigation.map((item) => (
            <nav className="menu menu-horizontal">
              <a
                href={item.href}
                className="btn btn-ghost text-lg font-semibold"
              >
                {item.name}
              </a>
            </nav>
          ))}
        </div>
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
