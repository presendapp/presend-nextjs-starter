import { CheckForm } from "./check-form";

export default function Home() {
  return (
    <main>
      <h1>Check your dependencies</h1>
      <p>
        Paste a <code>package.json</code> or a <code>requirements.txt</code>. The server sends only the package names to the
        free <a href="https://presend.pages.dev/api">Presend API</a>, which flags names that do not exist, look-alikes of
        popular packages, packages first published less than 30 days ago, deprecated packages and recent publisher changes (npm).
      </p>
      <CheckForm />
      <p className="note">
        These are signals worth a look before installing, not a malware scan. Known vulnerabilities of the versions you use are
        not checked here.
      </p>
    </main>
  );
}
