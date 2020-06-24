import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Plugins, FilesystemDirectory } from '@capacitor/core';
import { Recipe } from '../models/recipe';

const { Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  public recipes: Recipe[] = [];
  public RECIPE_STORAGE = 'recipes';
  constructor(public toastController: ToastController) {}

  public async loadSavedRecipes() {
    const recipes = await Storage.get({ key: this.RECIPE_STORAGE });
    console.log('Recipes: ', recipes);

    this.recipes = JSON.parse(recipes.value) || [];
  }

  public async saveRecipe(recipe: Recipe) {
    await Filesystem.writeFile({
      path: recipe.name,
      data: recipe.name,
      directory: FilesystemDirectory.Data,
    });
    this.recipes.unshift(recipe);
    Storage.set({
      key: this.RECIPE_STORAGE,
      value: JSON.stringify(this.recipes),
    });
    await this.presentToast();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Recipe Created',
      duration: 2000,
    });
    toast.present();
  }
}
