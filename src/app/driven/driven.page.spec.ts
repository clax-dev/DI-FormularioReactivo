import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DrivenPage } from './driven.page';

describe('DrivenPage', () => {
  let component: DrivenPage;
  let fixture: ComponentFixture<DrivenPage>;

  beforeEach(() => {
    // La página usa routerLink, así que el test necesita un router
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DrivenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
