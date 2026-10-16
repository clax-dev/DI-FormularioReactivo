import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonInput, IonButton, IonSpinner, AlertController
} from '@ionic/angular';
import { FechaNoFuturaDirective, hashSHA256, hoyISO } from '../shared/validadores';

// Mismo formulario que /registro, pero con el modelo Template-Driven:
// - Se importa FormsModule (ngModel / ngForm) en lugar de ReactiveFormsModule.
// - No hay FormBuilder ni FormGroup: Angular crea los controles a partir del HTML.
// - Las validaciones son atributos en el HTML (required, minlength, email, pattern...).
// - Los datos viven en un objeto normal enlazado con [(ngModel)] (two-way binding, mutable).
@Component({
  selector: 'app-driven',
  templateUrl: './driven.page.html',
  styleUrls: ['./driven.page.scss'],
  imports: [
    FormsModule, RouterLink, FechaNoFuturaDirective,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonInput, IonButton, IonSpinner
  ],
})
export class DrivenPage {
  private alertCtrl = inject(AlertController);

  // Modelo del formulario: [(ngModel)] lo lee y lo modifica directamente
  public modelo = {
    nombre: '',
    email: '',
    fechaNacimiento: '',
    password: '',
  };

  public isSubmitting = signal<boolean>(false);
  public hoy = hoyISO();

  // El formulario llega como parámetro desde la plantilla (#regForm="ngForm")
  public async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      const payload = {
        ...this.modelo,
        password: await hashSHA256(this.modelo.password),
      };
      console.log('Payload (Template-Driven) a enviar a la API REST:', payload);
      await new Promise(resolve => setTimeout(resolve, 2000));

      form.resetForm();

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
}
