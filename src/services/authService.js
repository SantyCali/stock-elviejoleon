export async function signInUser(email, password) {
  return { email, password };
}

export async function signOutUser() {
  return true;
}