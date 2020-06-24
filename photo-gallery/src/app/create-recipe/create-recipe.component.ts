import { Component, OnInit, ViewChild } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-recipe',
  templateUrl: './create-recipe.component.html',
  styleUrls: ['./create-recipe.component.scss'],
})
export class CreateRecipeComponent implements OnInit {
  @ViewChild('f', { static: false }) form: NgForm;
  public recipe: Recipe;
  constructor(
    public photoService: PhotoService,
    public recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.photoService.selectedPhotoPath) {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  public async onSubmit(form: NgForm) {
    const value = form.value;
    console.log('Form Value: ', value);
    const newRecipe: Recipe = {
      name: value.name,
      webviewPath: this.photoService.selectedPhotoPath,
    };
    await this.recipeService.saveRecipe(newRecipe);
    this.form.resetForm();
    this.router.navigate(['/tabs/tab1']);
  }

  public cancel() {
    this.router.navigate(['/tabs/tab1']);
  }
}
