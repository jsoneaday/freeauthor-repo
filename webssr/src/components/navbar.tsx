import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Explore", href: "/" },
  { name: "Read", href: "/read" },
  { name: "Write", href: "/write" },
];

export default function Navbar() {
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                ></path>
              </svg>
            </button>
            <ul className="menu dropdown-content menu-md z-[1] mt-3 w-52 gap-2 rounded-box bg-base-100 p-2 shadow">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <Link className="btn btn-ghost text-xl" href="/">
            {" "}
            FreeAuth
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          {navigation.map((item) => (
            <nav key={item.name} className="menu menu-horizontal">
              <Link
                href={item.href}
                className="btn btn-ghost text-lg font-semibold"
              >
                {item.name}
              </Link>
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
