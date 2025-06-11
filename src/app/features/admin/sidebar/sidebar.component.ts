import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit {
  username: string = '';
  role: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.username = currentUser.name;
      this.role = currentUser.role;
    }
  }

  logout() {
    this.authService.logout();
  }
} 