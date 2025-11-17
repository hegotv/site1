import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'viewsFormat',
  standalone: true,
})
export class ViewsFormatPipe implements PipeTransform {
  transform(views: number): string {
    if (views < 1000) {
      return views.toString();
    } else if (views < 1_000_000) {
      return (views / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else if (views < 1_000_000_000) {
      return (views / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else {
      return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
  }
}
