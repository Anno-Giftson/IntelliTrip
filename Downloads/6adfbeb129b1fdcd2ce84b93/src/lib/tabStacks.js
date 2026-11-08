// Per-tab navigation stacks. Each bottom tab remembers the screens the traveller
// opened inside it, so switching tabs and coming back lands where they left off.
// Kept at module scope because the shell remounts on every screen transition.
const stacks = {
  "/": ["/"],
  "/trips/new": ["/trips/new"],
  "/profile": ["/profile"],
};

export const TAB_ROOTS = ["/", "/trips/new", "/profile"];

export function tabFor(pathname) {
  if (pathname === "/trips/new" || pathname.startsWith("/trips/new/")) return "/trips/new";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "/profile";
  return "/";
}

export function rememberPath(pathname) {
  const tab = tabFor(pathname);
  const stack = stacks[tab] ?? [tab];
  if (stack[stack.length - 1] !== pathname) {
    stacks[tab] = [...stack, pathname].slice(-12);
  }
}

export function lastPathFor(tab) {
  const stack = stacks[tab] ?? [tab];
  return stack[stack.length - 1] ?? tab;
}