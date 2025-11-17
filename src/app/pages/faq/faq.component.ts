import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  faqs: FaqItem[] = [
    {
      question: 'Come posso registrarmi a Hego TV?',
      answer:
        'Puoi registrarti facilmente cliccando sul pulsante "Registrati" in alto a destra. Ti chiederemo solo un indirizzo email e una password per iniziare.',
      isOpen: false,
    },
    {
      question: 'Hego TV è un servizio a pagamento?',
      answer:
        'Offriamo sia contenuti gratuiti accessibili a tutti, sia un abbonamento Premium che sblocca tutte le nostre serie e podcast esclusivi, senza interruzioni pubblicitarie.',
      isOpen: false,
    },
    {
      question: 'Su quali dispositivi posso guardare i contenuti?',
      answer:
        'Hego TV è disponibile su tutti i principali browser web per desktop e mobile. Stiamo lavorando per lanciare le app native per iOS, Android e Smart TV.',
      isOpen: false,
    },
    {
      question: 'Posso disdire il mio abbonamento in qualsiasi momento?',
      answer:
        'Assolutamente sì. Puoi gestire il tuo abbonamento e disdirlo in qualsiasi momento dalla sezione "Profilo", senza costi nascosti o penali.',
      isOpen: false,
    },
  ];

  toggleFaq(item: FaqItem): void {
    item.isOpen = !item.isOpen;
  }
}
