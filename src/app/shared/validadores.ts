import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

// Lógica compartida por los dos formularios (Reactive en /registro y Template-Driven en /driven)

// Fecha de hoy en formato 'YYYY-MM-DD', el mismo que usa <input type="date">
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Validador personalizado: da error si la fecha es posterior a hoy.
// En Reactive Forms se pasa directamente en el FormBuilder: [Validators.required, fechaNoFutura]
export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;          // si está vacía, eso lo controla 'required'
  return control.value > hoyISO() ? { fechaFutura: true } : null;
}

// En Template-Driven no hay FormBuilder: los validadores se ponen como atributos en el HTML.
// Para usar uno personalizado hay que envolverlo en una directiva que se registra en NG_VALIDATORS.
// Uso: <ion-input ngModel name="fechaNacimiento" appFechaNoFutura>
@Directive({
  selector: '[appFechaNoFutura]',
  providers: [{ provide: NG_VALIDATORS, useExisting: FechaNoFuturaDirective, multi: true }],
})
export class FechaNoFuturaDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return fechaNoFutura(control);
  }
}

// Resumen SHA-256 en hexadecimal con la Web Crypto API del navegador (no necesita librerías).
// Es un hash de un solo sentido: no se puede "descifrar" para recuperar la contraseña original.
export async function hashSHA256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
