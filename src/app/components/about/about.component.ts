import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  principles = [
    'We believe in security through obscurity',
    'Our identities remain protected',
    'We operate on a need-to-know basis',
    'Trust is earned, not given'
  ];

  // Method to generate random binary digits (0 or 1)
  randomBit(): string {
    return Math.random() > 0.5 ? '1' : '0';
  }

  // Alternative: Pre-generate data stream for better performance
  dataStream: string[][] = this.generateDataStream();

  generateDataStream(): string[][] {
    const stream: string[][] = [];
    for (let i = 0; i < 10; i++) {
      const line: string[] = [];
      for (let j = 0; j < 10; j++) {
        line.push(Math.random() > 0.5 ? '1' : '0');
      }
      stream.push(line);
    }
    console.log(stream);
    
    return stream;
  }

  // For animated data stream (optional)
  animateDataStream() {
    setInterval(() => {
      this.dataStream = this.generateDataStream();
    }, 1000); // Update every second
  }

  ngOnInit() {
    // Uncomment if you want animated data stream
    // this.animateDataStream();
  }
}

