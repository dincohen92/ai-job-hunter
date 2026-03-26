// Auth removed — single-user local app. Always returns Din's user.
const DEFAULT_USER = {
  id: "cmlb70j660000vhm0x3p57ve7",
  email: "dincohen92@gmail.com",
  name: "din cohen",
};

export async function getSessionUser() {
  return DEFAULT_USER;
}
