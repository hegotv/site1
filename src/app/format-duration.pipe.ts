import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration',
  standalone: true,
})
export class FormatDurationPipe implements PipeTransform {
  isMobile: boolean = window.innerWidth <= 768;

  transform(duration: string): string {
    if (!duration) {
      return 'Durata non disponibile';
    }

    // Regex per formati tipo "HH:mm:ss"
    const regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match = duration.match(regex);

    if (!match) {
      return 'Formato durata non valido';
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);

    let shortParts = [];
    if (hours > 0) shortParts.push(`${hours}h`);
    if (minutes > 0) shortParts.push(`${minutes}m`);
    if (seconds > 0 || shortParts.length === 0) shortParts.push(`${seconds}s`);
    return shortParts.join(' ');
  }
}
