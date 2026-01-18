import { redirect } from "next/navigation"

export default function Home() {
  // Redirigir al login como página principal
  redirect("/login")
}
