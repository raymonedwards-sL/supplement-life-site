// Moved to components/LoginPrompt.tsx so it can be shared with /dashboard.
// Re-exported here in case anything still imports this path — the sandbox
// this was built in can't delete files on your mounted folder, so this
// file is kept as a harmless redirect rather than left as stale duplicate
// code. Safe to delete manually if you'd like to tidy it up.
export { default } from "@/components/LoginPrompt";
