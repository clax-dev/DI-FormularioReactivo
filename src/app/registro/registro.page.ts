import { Component, signal, inject } from '@angular/core';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonList, IonItem, IonInput, IonButton, IonSpinner, IonIcon, AlertController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moon, sunny } from 'ionicons/icons';
import { jsPDF } from 'jspdf';

// Fecha de hoy en formato 'YYYY-MM-DD', el mismo que usa <input type="date">
function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Validador personalizado: da error si la fecha es posterior a hoy
function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;          // si está vacía, eso lo controla 'required'
  return control.value > hoyISO() ? { fechaFutura: true } : null;
}

// Resumen SHA-256 en hexadecimal con la Web Crypto API del navegador (no necesita librerías).
// Es un hash de un solo sentido: no se puede "descifrar" para recuperar la contraseña original.
async function hashSHA256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface DatosRegistro {
  nombre: string;
  email: string;
  fechaNacimiento: string;
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonList, IonItem, IonInput, IonButton, IonSpinner, IonIcon
  ],
})
export class RegistroPage {
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);

  constructor() {
    // En standalone, los iconos de ionicons hay que registrarlos antes de usarlos en el HTML
    addIcons({ moon, sunny });
  }

  public registroForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
    password: ['', [Validators.required,
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)]]
  });

  public isSubmitting = signal<boolean>(false);
  public hoy = hoyISO();

  // Modo oscuro: añade o quita la clase 'ion-palette-dark' del <html> (ver global.scss)
  public modoOscuro = signal<boolean>(false);

  // Datos del último envío, para poder descargarlos en PDF después del reset()
  public ultimoEnvio = signal<DatosRegistro | null>(null);

  get f() { return this.registroForm.controls; }

  public async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      // Se sustituye la contraseña por su hash antes de mostrarla o enviarla
      const payload = {
        ...this.registroForm.value,
        password: await hashSHA256(this.registroForm.value.password),
      };
      console.log('Payload a enviar a la API REST:', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { nombre, email, fechaNacimiento } = this.registroForm.value;
      this.ultimoEnvio.set({ nombre, email, fechaNacimiento });
      this.registroForm.reset();

      const alert = await this.alertCtrl.create({
        header: 'Registro completado',
        message: 'El formulario se ha enviado correctamente.',
        buttons: ['OK'],
      });
      await alert.present();
    } catch (error) {
      console.error('Error al persistir los datos', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleModoOscuro(): void {
    this.modoOscuro.update(valor => !valor);
    document.documentElement.classList.toggle('ion-palette-dark', this.modoOscuro());
  }

  descargarPdf(): void {
    const datos = this.ultimoEnvio();
    if (!datos) return;

    // La contraseña no se incluye en el PDF a propósito
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Datos del registro', 20, 20);
    doc.setFontSize(12);
    doc.text(`Nombre: ${datos.nombre}`, 20, 40);
    doc.text(`Email: ${datos.email}`, 20, 50);
    doc.text(`Fecha de nacimiento: ${datos.fechaNacimiento}`, 20, 60);
    doc.save('registro.pdf');
  }
}
