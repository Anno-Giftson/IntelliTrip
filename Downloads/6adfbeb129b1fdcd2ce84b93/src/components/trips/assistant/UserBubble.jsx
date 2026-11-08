export default function UserBubble({ children }) {
  return (
    <p className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground shadow-sm">
      {children}
    </p>
  );
}