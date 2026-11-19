"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField, AuthRequestError, registerAndLogin } from "@/lib/auth";

const fieldLabels: Record<AuthField, string> = {
  email: "Email",
  password: "Contraseña",
  name: "Nombre",
  phone: "Teléfono",
  address: "Dirección",
};

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "", name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Partial<Record<AuthField, string>>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: AuthField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setGeneralError("");
    setIsSubmitting(true);
    const data = {
      email: values.email.trim(),
      password: values.password,
      ...(values.name.trim() ? { name: values.name.trim() } : {}),
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      ...(values.address.trim() ? { address: values.address.trim() } : {}),
    };

    try {
      await registerAndLogin(data);
      router.replace("/");
    } catch (cause) {
      if (cause instanceof AuthRequestError) {
        setErrors(cause.fieldErrors);
        setGeneralError(Object.keys(cause.fieldErrors).length === 0 ? cause.message : "");
      } else {
        setGeneralError("No se pudo conectar con el servicio. Inténtalo de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-wide" aria-labelledby="register-title">
        <Link className="brand auth-brand" href="/">nexova<span>.</span></Link>
        <p className="eyebrow">People &amp; Talent</p>
        <h1 id="register-title">Crea tu cuenta</h1>
        <p className="lead">Regístrate para acceder al espacio de trabajo.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {(["email", "password", "name", "phone", "address"] as AuthField[]).map((field) => {
            const required = field === "email" || field === "password";
            const type = field === "email" ? "email" : field === "password" ? "password" : "text";
            return (
              <div className="form-field" key={field}>
                <label htmlFor={field}>{fieldLabels[field]}{required && <span> *</span>}</label>
                <input
                  className="control"
                  id={field}
                  name={field}
                  type={type}
                  autoComplete={field === "email" ? "email" : field === "password" ? "new-password" : field === "name" ? "name" : "off"}
                  required={required}
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={errors[field] ? `${field}-error` : undefined}
                  value={values[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                />
                {errors[field] && <span className="field-error" id={`${field}-error`} role="alert">{errors[field]}</span>}
              </div>
            );
          })}
          {generalError && <p className="feedback-error" role="alert">{generalError}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creando cuenta…" : "Crear cuenta"}</button>
        </form>
        <p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
      </section>
    </main>
  );
}
